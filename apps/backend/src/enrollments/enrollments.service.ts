import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DrizzleService } from '../drizzle.service';
import { enrollments, users, courses } from '../db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EnrollmentsService {
  constructor(private drizzle: DrizzleService) {}

  async findByCourse(courseId: string) {
    const result = await this.drizzle.db
      .select({
        id: enrollments.id,
        enrolledAt: enrollments.enrolledAt,
        certificateIssued: enrollments.certificateIssued,
        studentId: users.id,
        nombres: users.nombres,
        apellidoPaterno: users.apellidoPaterno,
        apellidoMaterno: users.apellidoMaterno,
        ci: users.ci,
        studentEmail: users.email,
        celular: users.celular,
      })
      .from(enrollments)
      .leftJoin(users, eq(enrollments.studentId, users.id))
      .where(eq(enrollments.courseId, courseId))
      .orderBy(asc(users.apellidoPaterno), asc(users.apellidoMaterno), asc(users.nombres));

    return result.map(r => ({
      ...r,
      studentName: `${r.apellidoPaterno} ${r.apellidoMaterno ?? ''} ${r.nombres}`.trim(),
    }));
  }

  async findByStudent(studentId: string) {
    return this.drizzle.db
      .select({
        id: enrollments.id,
        enrolledAt: enrollments.enrolledAt,
        certificateIssued: enrollments.certificateIssued,
        courseId: courses.id,
        courseName: courses.name,
        courseInstructor: courses.instructor,
        courseHours: courses.hours,
      })
      .from(enrollments)
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.studentId, studentId));
  }

  async enroll(studentId: string, courseId: string) {
    const existing = await this.drizzle.db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.studentId, studentId), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (existing[0]) throw new ConflictException('El estudiante ya está inscrito en este curso');

    const id = uuidv4();
    await this.drizzle.db.insert(enrollments).values({ id, studentId, courseId });
    return { id, studentId, courseId, message: 'Inscripción exitosa' };
  }

  async enrollMany(studentIds: string[], courseId: string) {
    const results: any[] = []
    for (const studentId of studentIds) {
      try {
        const result = await this.enroll(studentId, courseId)
        results.push({ ...result, status: 'ok' })
      } catch (e: any) {
        results.push({ studentId, status: 'error', message: e.message })
      }
    }
    return results
  }

  async unenroll(id: string) {
    const result = await this.drizzle.db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, id))
      .limit(1);
    if (!result[0]) throw new NotFoundException('Inscripción no encontrada');
    await this.drizzle.db.delete(enrollments).where(eq(enrollments.id, id));
    return { message: 'Inscripción eliminada' };
  }

  async markCertificateIssued(studentId: string, courseId: string) {
    await this.drizzle.db
      .update(enrollments)
      .set({ certificateIssued: true })
      .where(and(eq(enrollments.studentId, studentId), eq(enrollments.courseId, courseId)));
  }
}