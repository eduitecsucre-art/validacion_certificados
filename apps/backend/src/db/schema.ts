import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  nombres: text('nombres').notNull(),
  apellidoPaterno: text('apellido_paterno').notNull(),
  apellidoMaterno: text('apellido_materno'),
  ci: text('ci'),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  celular: text('celular'),
  role: text('role').notNull().default('STUDENT'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export const courses = sqliteTable('courses', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  instructor: text('instructor').notNull().default(''),
  hours: integer('hours').notNull(),
  validityDays: integer('validity_days').notNull().default(365),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export const enrollments = sqliteTable('enrollments', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => users.id),
  courseId: text('course_id').notNull().references(() => courses.id),
  certificateIssued: integer('certificate_issued', { mode: 'boolean' }).notNull().default(false),
  enrolledAt: text('enrolled_at').default(sql`(datetime('now'))`),
});

export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  courseId: text('course_id').notNull().references(() => courses.id),
  imageUrl: text('image_url').notNull(),
  fields: text('fields').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export const certificates = sqliteTable('certificates', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  studentId: text('student_id').notNull().references(() => users.id),
  courseId: text('course_id').notNull().references(() => courses.id),
  issuedById: text('issued_by_id').notNull().references(() => users.id),
  instructor: text('instructor').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  hours: integer('hours').notNull(),
  expiresAt: text('expires_at').notNull(),
  status: text('status').notNull().default('VALID'),
  pdfUrl: text('pdf_url'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  certificateId: text('certificate_id').notNull(),
  type: text('type').notNull(),
  sentAt: text('sent_at'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});