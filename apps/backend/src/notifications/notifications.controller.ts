import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DrizzleService } from '../drizzle.service';
import { notifications, certificates, users, courses } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private drizzle: DrizzleService) {}

  @Roles('SUPER_ADMIN', 'STAFF')
  @Get()
  async findAll() {
    const result = await this.drizzle.db
      .select({
        id: notifications.id,
        certificateId: notifications.certificateId,
        type: notifications.type,
        sentAt: notifications.sentAt,
        createdAt: notifications.createdAt,
        certificateCode: certificates.code,
        studentEmail: users.email,
        nombres: users.nombres,
        apellidoPaterno: users.apellidoPaterno,
        apellidoMaterno: users.apellidoMaterno,
        courseName: courses.name,
      })
      .from(notifications)
      .leftJoin(certificates, eq(notifications.certificateId, certificates.id))
      .leftJoin(users, eq(certificates.studentId, users.id))
      .leftJoin(courses, eq(certificates.courseId, courses.id))
      .orderBy(desc(notifications.createdAt));

    return result.map(n => ({
      ...n,
      studentName: n.nombres
        ? `${n.apellidoPaterno} ${n.apellidoMaterno ?? ''} ${n.nombres}`.replace(/\s+/g, ' ').trim()
        : null,
    }));
  }
}