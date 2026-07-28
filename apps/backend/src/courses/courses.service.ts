import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../drizzle.service';
import { courses } from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CoursesService {
  constructor(private drizzle: DrizzleService) {}

  async findAll() {
    return this.drizzle.db.select().from(courses);
  }

  async findOne(id: string) {
    const result = await this.drizzle.db
      .select()
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);
    if (!result[0]) throw new NotFoundException('Curso no encontrado');
    return result[0];
  }

  async create(data: { name: string; description?: string; hours: number; validityDays?: number }) {
    const id = uuidv4();
    await this.drizzle.db.insert(courses).values({
      id,
      name: data.name,
      description: data.description,
      hours: data.hours,
      validityDays: data.validityDays ?? 365,
    });
    return this.findOne(id);
  }

  async update(id: string, data: Partial<{ name: string; description: string; hours: number; validityDays: number; active: boolean }>) {
    await this.findOne(id);
    await this.drizzle.db.update(courses).set(data).where(eq(courses.id, id));
    return this.findOne(id);
  }

  async deactivate(id: string) {
    await this.findOne(id);
    await this.drizzle.db.update(courses).set({ active: false }).where(eq(courses.id, id));
    return { message: 'Curso desactivado' };
  }
}