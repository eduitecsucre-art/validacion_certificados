import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DrizzleService } from '../drizzle.service';
import { certificates, users, courses, notifications } from '../db/schema';
import { eq, and, lte, gte } from 'drizzle-orm';
import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private resend: Resend;

  constructor(private drizzle: DrizzleService) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkExpiringCertificates() {
    this.logger.log('Revisando certificados por vencer...');

    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);

    const expiring = await this.drizzle.db
      .select({
        id: certificates.id,
        code: certificates.code,
        expiresAt: certificates.expiresAt,
        studentId: certificates.studentId,
        studentName: users.name,
        studentEmail: users.email,
        courseName: courses.name,
      })
      .from(certificates)
      .leftJoin(users, eq(certificates.studentId, users.id))
      .leftJoin(courses, eq(certificates.courseId, courses.id))
      .where(
        and(
          eq(certificates.status, 'VALID'),
          lte(certificates.expiresAt, in30Days.toISOString()),
          gte(certificates.expiresAt, now.toISOString()),
        )
      );

    for (const cert of expiring) {
      await this.sendExpirationEmail(cert);
    }

    this.logger.log(`${expiring.length} certificados por vencer notificados`);
  }

  async sendExpirationEmail(cert: any) {
    try {
      const existing = await this.drizzle.db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.certificateId, cert.id),
            eq(notifications.type, 'EXPIRATION_WARNING'),
          )
        )
        .limit(1);

      if (existing[0]?.sentAt) return;

      await this.resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'certificados@tuinstitucion.com',
        to: cert.studentEmail,
        subject: `Tu certificado de ${cert.courseName} está por vencer`,
        html: `
          <h2>Hola ${cert.studentName},</h2>
          <p>Tu certificado del curso <strong>${cert.courseName}</strong> vence el <strong>${new Date(cert.expiresAt).toLocaleDateString('es-ES')}</strong>.</p>
          <p>Código del certificado: <strong>${cert.code}</strong></p>
          <p>Te recomendamos renovar tu certificado para mantener tus credenciales actualizadas.</p>
          <p>Contáctanos para más información.</p>
        `,
      });

      await this.drizzle.db.insert(notifications).values({
        id: uuidv4(),
        certificateId: cert.id,
        type: 'EXPIRATION_WARNING',
        sentAt: new Date().toISOString(),
      });

      this.logger.log(`Email enviado a ${cert.studentEmail}`);
    } catch (error) {
        this.logger.error(`Error enviando email: ${(error as Error).message}`);    }
  }

  async getExpiringCertificates(days: number = 30) {
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + days);

    return this.drizzle.db
      .select({
        id: certificates.id,
        code: certificates.code,
        expiresAt: certificates.expiresAt,
        status: certificates.status,
        studentName: users.name,
        studentEmail: users.email,
        courseName: courses.name,
      })
      .from(certificates)
      .leftJoin(users, eq(certificates.studentId, users.id))
      .leftJoin(courses, eq(certificates.courseId, courses.id))
      .where(
        and(
          eq(certificates.status, 'VALID'),
          lte(certificates.expiresAt, future.toISOString()),
          gte(certificates.expiresAt, now.toISOString()),
        )
      );
  }
}