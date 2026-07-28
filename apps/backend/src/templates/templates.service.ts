import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../drizzle.service';
import { templates } from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TemplatesService {
  constructor(private drizzle: DrizzleService) {}

  async findAll() {
    return this.drizzle.db.select().from(templates);
  }

  async findByCourse(courseId: string) {
    return this.drizzle.db
      .select()
      .from(templates)
      .where(eq(templates.courseId, courseId));
  }

  async findOne(id: string) {
    const result = await this.drizzle.db
      .select()
      .from(templates)
      .where(eq(templates.id, id))
      .limit(1);
    if (!result[0]) throw new NotFoundException('Plantilla no encontrada');
    return result[0];
  }

  async create(data: { courseId: string; imageUrl: string; fields: object }) {
    const id = uuidv4();
    await this.drizzle.db.insert(templates).values({
      id,
      courseId: data.courseId,
      imageUrl: data.imageUrl,
      fields: JSON.stringify(data.fields),
    });
    return this.findOne(id);
  }

  async update(id: string, data: Partial<{ imageUrl: string; fields: object }>) {
    await this.findOne(id);
    const updateData: any = { ...data };
    if (data.fields) updateData.fields = JSON.stringify(data.fields);
    await this.drizzle.db.update(templates).set(updateData).where(eq(templates.id, id));
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.drizzle.db.delete(templates).where(eq(templates.id, id));
    return { message: 'Plantilla eliminada' };
  }
}