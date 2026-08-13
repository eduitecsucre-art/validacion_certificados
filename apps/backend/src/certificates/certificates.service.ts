import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DrizzleService } from '../drizzle.service';
import { certificates, users, courses, enrollments } from '../db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import { Resend } from 'resend';

@Injectable()
export class CertificatesService {
  private resend: Resend;

  constructor(private drizzle: DrizzleService) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  private generateCode(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 90000) + 10000;
    return `CERT-${year}-${random}`;
  }

  private fullName(user: any): string {
    return `${user.apellidoPaterno} ${user.apellidoMaterno ?? ''} ${user.nombres}`.trim();
  }

  /**
   * Marca como EXPIRED cualquier certificado que siga como VALID
   * pero cuya fecha de vencimiento ya pasó.
   */
  private async expireOverdue() {
    const now = new Date().toISOString();
    await this.drizzle.db
      .update(certificates)
      .set({ status: 'EXPIRED' })
      .where(and(eq(certificates.status, 'VALID'), lt(certificates.expiresAt, now)));
  }

  async findAll() {
    await this.expireOverdue();
    return this.drizzle.db.select().from(certificates);
  }

  async findByStudent(studentId: string) {
    await this.expireOverdue();
    return this.drizzle.db
      .select()
      .from(certificates)
      .where(eq(certificates.studentId, studentId));
  }

  async findOne(id: string) {
    const result = await this.drizzle.db
      .select()
      .from(certificates)
      .where(eq(certificates.id, id))
      .limit(1);
    if (!result[0]) throw new NotFoundException('Certificado no encontrado');
    return result[0];
  }

  async findByCode(code: string) {
    const result = await this.drizzle.db
      .select({
        id: certificates.id,
        code: certificates.code,
        instructor: certificates.instructor,
        startDate: certificates.startDate,
        endDate: certificates.endDate,
        hours: certificates.hours,
        expiresAt: certificates.expiresAt,
        status: certificates.status,
        nombres: users.nombres,
        apellidoPaterno: users.apellidoPaterno,
        apellidoMaterno: users.apellidoMaterno,
        ci: users.ci,
        courseName: courses.name,
      })
      .from(certificates)
      .leftJoin(users, eq(certificates.studentId, users.id))
      .leftJoin(courses, eq(certificates.courseId, courses.id))
      .where(eq(certificates.code, code))
      .limit(1);

    if (!result[0]) throw new NotFoundException('Certificado no encontrado');

    const cert = result[0];
    const now = new Date();
    const expiresAt = new Date(cert.expiresAt!);
    if (expiresAt < now && cert.status === 'VALID') {
      await this.drizzle.db
        .update(certificates)
        .set({ status: 'EXPIRED' })
        .where(eq(certificates.code, code));
      cert.status = 'EXPIRED';
    }

    return {
      ...cert,
      studentName: this.fullName(cert),
    };
  }

  async create(data: {
    studentId: string;
    courseId: string;
    issuedById: string;
    instructor: string;
    startDate: string;
    endDate?: string;
    hours: number;
  }) {
    // Bloquear solo si ya tiene un certificado VIGENTE del mismo curso.
    // Si el anterior expiró o fue revocado, sí se permite emitir uno nuevo
    // (ej: el curso se dicta cada año y el estudiante lo vuelve a tomar).
    const existingValid = await this.drizzle.db
      .select()
      .from(certificates)
      .where(and(
        eq(certificates.studentId, data.studentId),
        eq(certificates.courseId, data.courseId),
        eq(certificates.status, 'VALID'),
      ))
      .limit(1);

    if (existingValid[0]) {
      throw new ConflictException('Este estudiante ya tiene un certificado vigente para este curso');
    }

    const id = uuidv4();
    const code = this.generateCode();

    const courseResult = await this.drizzle.db
      .select()
      .from(courses)
      .where(eq(courses.id, data.courseId))
      .limit(1);

    const course = courseResult[0];
    if (!course) throw new NotFoundException('Curso no encontrado');

    const expiresAt = new Date(data.startDate);
    expiresAt.setDate(expiresAt.getDate() + course.validityDays);

    const baseUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const qrUrl = `${baseUrl}/verificar/${code}`;
    const qrCode = await QRCode.toDataURL(qrUrl);

    await this.drizzle.db.insert(certificates).values({
      id,
      code,
      studentId: data.studentId,
      courseId: data.courseId,
      issuedById: data.issuedById,
      instructor: data.instructor,
      startDate: data.startDate,
      endDate: data.endDate,
      hours: data.hours,
      expiresAt: expiresAt.toISOString(),
      status: 'VALID',
    });

    // Marcar certificado como emitido en enrollment
    await this.drizzle.db
      .update(enrollments)
      .set({ certificateIssued: true })
      .where(and(
        eq(enrollments.studentId, data.studentId),
        eq(enrollments.courseId, data.courseId)
      ));

    const studentResult = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, data.studentId))
      .limit(1);

    const student = studentResult[0];

    if (student?.email && process.env.RESEND_API_KEY !== 're_placeholder') {
      try {
        await this.resend.emails.send({
          from: process.env.EMAIL_FROM ?? 'certificados@tuinstitucion.com',
          to: student.email,
          subject: `Tu certificado de ${course.name} ha sido emitido`,
          html: `
            <h2>¡Felicitaciones ${this.fullName(student)}!</h2>
            <p>Tu certificado del curso <strong>${course.name}</strong> ha sido emitido exitosamente.</p>
            <p><strong>Código:</strong> ${code}</p>
            <p><strong>Instructor:</strong> ${data.instructor}</p>
            <p><strong>Horas académicas:</strong> ${data.hours}h</p>
            <p><strong>Válido hasta:</strong> ${expiresAt.toLocaleDateString('es-ES')}</p>
            <p>Puedes verificar tu certificado en: <a href="${qrUrl}">${qrUrl}</a></p>
          `,
        });
      } catch (e) {
        console.error('Error enviando email de confirmación:', e);
      }
    }

    return { ...await this.findOne(id), qrCode };
  }

  async createMany(data: {
    studentIds: string[];
    courseId: string;
    issuedById: string;
    instructor: string;
    startDate: string;
    endDate?: string;
    hours: number;
  }) {
    const results: any[] = [];
    for (const studentId of data.studentIds) {
      try {
        const cert = await this.create({
          studentId,
          courseId: data.courseId,
          issuedById: data.issuedById,
          instructor: data.instructor,
          startDate: data.startDate,
          endDate: data.endDate,
          hours: data.hours,
        });
        results.push({ studentId, status: 'ok', certificateId: cert.id, code: cert.code });
      } catch (e: any) {
        results.push({ studentId, status: 'error', message: e.message ?? 'Error desconocido' });
      }
    }
    return results;
  }

  async revoke(id: string) {
    await this.findOne(id);
    await this.drizzle.db
      .update(certificates)
      .set({ status: 'REVOKED' })
      .where(eq(certificates.id, id));
    return { message: 'Certificado revocado' };
  }

  async reactivate(id: string) {
    await this.findOne(id);
    await this.drizzle.db
      .update(certificates)
      .set({ status: 'VALID' })
      .where(eq(certificates.id, id));
    return { message: 'Certificado reactivado' };
  }

  async remove(id: string) {
    const cert = await this.findOne(id);

    // Si la inscripción original todavía existe, la desmarcamos
    // como "certificado emitido" (no falla si ya no existe)
    await this.drizzle.db
      .update(enrollments)
      .set({ certificateIssued: false })
      .where(and(
        eq(enrollments.studentId, cert.studentId),
        eq(enrollments.courseId, cert.courseId)
      ));

    await this.drizzle.db.delete(certificates).where(eq(certificates.id, id));
    return { message: 'Certificado eliminado permanentemente' };
  }
}