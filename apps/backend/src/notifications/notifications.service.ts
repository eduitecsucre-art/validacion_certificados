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

  private fullName(user: any): string {
    return `${user.apellidoPaterno} ${user.apellidoMaterno ?? ''} ${user.nombres}`.trim();
  }

  // Registra el intento de notificación en la BD. sentAt = null significa
  // que se intentó pero falló (queda visible como "Pendiente" en el panel,
  // ya que hoy no tenemos una columna de error dedicada en el schema).
  private async recordNotification(certificateId: string, type: string, sent: boolean) {
    await this.drizzle.db.insert(notifications).values({
      id: uuidv4(),
      certificateId,
      type,
      sentAt: sent ? new Date().toISOString() : null,
    });
  }

  // Se llama desde CertificatesService justo al emitir un certificado nuevo.
  async sendIssuanceEmail(cert: {
    id: string;
    studentEmail: string;
    studentName: string;
    courseName: string;
    code: string;
    instructor: string;
    hours: number;
    expiresAt: string;
    verifyUrl: string;
    downloadPageUrl
  }) {
    if (!cert.studentEmail || process.env.RESEND_API_KEY === 're_placeholder') {
      return;
    }

    try {
      await this.resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'certificados@tuinstitucion.com',
        to: cert.studentEmail,
        subject: `Tu certificado de ${cert.courseName} ha sido emitido`,
        html: `
  <h2>¡Felicitaciones ${cert.studentName}!</h2>
  <p>Tu certificado del curso <strong>${cert.courseName}</strong> ha sido emitido exitosamente.</p>
  <p><strong>Código:</strong> ${cert.code}</p>
  <p><strong>Instructor:</strong> ${cert.instructor}</p>
  <p><strong>Horas académicas:</strong> ${cert.hours}h</p>
  <p><strong>Válido hasta:</strong> ${new Date(cert.expiresAt).toLocaleDateString('es-ES')}</p>
  <p style="margin: 24px 0;">
    <a href="${cert.downloadPageUrl}"
       style="background-color: #4f46e5; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
      📄 Descargar mi certificado
    </a>
  </p>
  <p style="font-size: 13px; color: #6b7280;">
    Busca tu certificado ingresando tu número de CI. Si necesitas comprobar la validez de este certificado ante un tercero (por ejemplo, un empleador), puedes compartir este enlace de verificación: <a href="${cert.verifyUrl}">${cert.verifyUrl}</a>
  </p>
`,
      });

      await this.recordNotification(cert.id, 'CERTIFICATE_ISSUED', true);
      this.logger.log(`Email de emisión enviado a ${cert.studentEmail}`);
    } catch (error) {
      await this.recordNotification(cert.id, 'CERTIFICATE_ISSUED', false);
      this.logger.error(`Error enviando email de emisión: ${(error as Error).message}`);
    }
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
        nombres: users.nombres,
        apellidoPaterno: users.apellidoPaterno,
        apellidoMaterno: users.apellidoMaterno,
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
      await this.sendExpirationEmail({
        ...cert,
        studentName: this.fullName(cert),
      });
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
        `,
      });

      await this.recordNotification(cert.id, 'EXPIRATION_WARNING', true);
      this.logger.log(`Email enviado a ${cert.studentEmail}`);
    } catch (error) {
      await this.recordNotification(cert.id, 'EXPIRATION_WARNING', false);
      this.logger.error(`Error enviando email: ${(error as Error).message}`);
    }
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
        nombres: users.nombres,
        apellidoPaterno: users.apellidoPaterno,
        apellidoMaterno: users.apellidoMaterno,
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