import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../drizzle.service';
import { certificates, users, courses } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';

@Injectable()
export class CertificatesService {
  constructor(private drizzle: DrizzleService) {}

  private generateCode(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 90000) + 10000;
    return `CERT-${year}-${random}`;
  }

  async findAll() {
    return this.drizzle.db.select().from(certificates);
  }

  async findByStudent(studentId: string) {
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
        studentName: users.name,
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

    return cert;
  }

  async create(data: {
    studentId: string;
    courseId: string;
    issuedById: string;
    instructor: string;
    startDate: string;
    endDate?: string;
    hours: number;
    validityDays?: number;
  }) {
    const id = uuidv4();
    const code = this.generateCode();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.validityDays ?? 365));

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

    return { ...await this.findOne(id), qrCode };
  }

  async revoke(id: string) {
    await this.findOne(id);
    await this.drizzle.db
      .update(certificates)
      .set({ status: 'REVOKED' })
      .where(eq(certificates.id, id));
    return { message: 'Certificado revocado' };
  }
}