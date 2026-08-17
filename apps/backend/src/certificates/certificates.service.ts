import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { DrizzleService } from '../drizzle.service';
import { certificates, users, courses, enrollments } from '../db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import { Resend } from 'resend';
import { TemplatesService } from '../templates/templates.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PdfGeneratorService } from './pdf-generator.service';

@Injectable()
export class CertificatesService {
  private resend: Resend;

  constructor(
    private drizzle: DrizzleService,
    private templatesService: TemplatesService,
    private cloudinary: CloudinaryService,
    private pdfGenerator: PdfGeneratorService,
  ) {
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

  // Genera el PDF a partir de la plantilla del curso y lo sube a Cloudinary.
  // Si el curso no tiene plantilla configurada todavía, devuelve null en vez
  // de fallar — el certificado se emite igual, solo que sin PDF por ahora.
  private async generateAndUploadPdf(params: {
    courseId: string;
    studentName: string;
    courseName: string;
    instructor: string;
    startDate: string;
    endDate?: string;
    hours: number;
    code: string;
    verifyUrl: string;
  }): Promise<string | null> {
    const template = await this.templatesService.findByCourse(params.courseId);
    if (!template || !template.fields || template.fields.length === 0) {
      return null;
    }

    try {
      const imageRes = await fetch(template.imageUrl);
      if (!imageRes.ok) return null;
      const imageMime = imageRes.headers.get('content-type') ?? 'image/jpeg';
      const imageBytes = Buffer.from(await imageRes.arrayBuffer());

      const pdfBuffer = await this.pdfGenerator.generate(
        imageBytes,
        imageMime,
        template.fields,
        {
          studentName: params.studentName,
          courseName: params.courseName,
          instructor: params.instructor,
          startDate: params.startDate,
          endDate: params.endDate,
          hours: params.hours,
          code: params.code,
          verifyUrl: params.verifyUrl,
        },
      );

      return await this.cloudinary.uploadBuffer(pdfBuffer, 'certificados/pdfs', 'raw');
    } catch (e) {
      console.error('Error generando PDF del certificado:', e);
      return null;
    }
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

    const studentResult = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, data.studentId))
      .limit(1);

    const student = studentResult[0];
    if (!student) throw new NotFoundException('Estudiante no encontrado');

    // Genera el PDF ANTES de insertar, así el registro ya nace con pdfUrl si aplica
    const pdfUrl = await this.generateAndUploadPdf({
      courseId: data.courseId,
      studentName: this.fullName(student),
      courseName: course.name,
      instructor: data.instructor,
      startDate: data.startDate,
      endDate: data.endDate,
      hours: data.hours,
      code,
      verifyUrl: qrUrl,
    });

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
      pdfUrl: pdfUrl ?? undefined,
    });

    await this.drizzle.db
      .update(enrollments)
      .set({ certificateIssued: true })
      .where(and(
        eq(enrollments.studentId, data.studentId),
        eq(enrollments.courseId, data.courseId)
      ));

    if (student.email && process.env.RESEND_API_KEY !== 're_placeholder') {
      try {
        const qrCode = await QRCode.toDataURL(qrUrl);
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

    return this.findOne(id);
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

  // Devuelve los bytes del PDF solo si quien pide tiene permiso (admin/staff,
  // o el propio estudiante dueño del certificado) Y el certificado sigue VALID.
  async getDownloadableFile(id: string, requester: { id: string; role: string }) {
    const cert = await this.findOne(id);

    const isStaffOrAdmin = requester.role === 'SUPER_ADMIN' || requester.role === 'STAFF';
    const isOwner = requester.id === cert.studentId;
    if (!isStaffOrAdmin && !isOwner) {
      throw new ForbiddenException('No tienes permiso para descargar este certificado');
    }

    const now = new Date();
    if (cert.status === 'VALID' && new Date(cert.expiresAt) < now) {
      await this.drizzle.db
        .update(certificates)
        .set({ status: 'EXPIRED' })
        .where(eq(certificates.id, id));
      cert.status = 'EXPIRED';
    }

    if (cert.status !== 'VALID') {
      throw new ConflictException(
        `Este certificado no se puede descargar porque su estado es ${cert.status}`,
      );
    }

    if (!cert.pdfUrl) {
      throw new NotFoundException(
        'Este certificado no tiene un PDF disponible (el curso no tenía plantilla configurada al momento de emitirlo)',
      );
    }

    const response = await fetch(cert.pdfUrl);
    if (!response.ok) {
      throw new NotFoundException('No se pudo obtener el archivo del certificado');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return { buffer, filename: `${cert.code}.pdf` };
  }

  // Búsqueda pública por CI. No requiere login (así lo decidimos), por eso
// no recibe "requester" ni valida dueño — cualquiera que sepa el CI puede
// ver esta lista, igual que ya pasa con la verificación pública por código.
async findByCI(ci: string) {
  await this.expireOverdue();

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
      pdfUrl: certificates.pdfUrl,
      courseName: courses.name,
    })
    .from(certificates)
    .leftJoin(users, eq(certificates.studentId, users.id))
    .leftJoin(courses, eq(certificates.courseId, courses.id))
    .where(eq(users.ci, ci));

  return result.map(r => ({ ...r, pdfUrl: undefined, hasPdf: !!r.pdfUrl && r.status === 'VALID' }));
}

// Descarga pública: mismo control de estado que getDownloadableFile,
// pero sin verificar dueño (no hay sesión en este flujo).
async getPublicDownloadableFile(id: string) {
  const cert = await this.findOne(id);

  const now = new Date();
  if (cert.status === 'VALID' && new Date(cert.expiresAt) < now) {
    await this.drizzle.db
      .update(certificates)
      .set({ status: 'EXPIRED' })
      .where(eq(certificates.id, id));
    cert.status = 'EXPIRED';
  }

  if (cert.status !== 'VALID') {
    throw new ConflictException(
      `Este certificado no se puede descargar porque su estado es ${cert.status}`,
    );
  }

  if (!cert.pdfUrl) {
    throw new NotFoundException('Este certificado no tiene un PDF disponible');
  }

  const response = await fetch(cert.pdfUrl);
  if (!response.ok) {
    throw new NotFoundException('No se pudo obtener el archivo del certificado');
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer, filename: `${cert.code}.pdf` };
}
}