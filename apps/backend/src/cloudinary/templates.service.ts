//import type { File as MulterFile } from 'multer';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../drizzle.service';
import { templates } from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class TemplatesService {
  constructor(
    private drizzle: DrizzleService,
    private cloudinary: CloudinaryService,
  ) { }

  async findByCourse(courseId: string) {
    const result = await this.drizzle.db
      .select()
      .from(templates)
      .where(eq(templates.courseId, courseId))
      .limit(1);
    if (!result[0]) return null;
    return { ...result[0], fields: JSON.parse(result[0].fields) };
  }

  async findOne(id: string) {
    const result = await this.drizzle.db
      .select()
      .from(templates)
      .where(eq(templates.id, id))
      .limit(1);
    if (!result[0]) throw new NotFoundException('Plantilla no encontrada');
    return { ...result[0], fields: JSON.parse(result[0].fields) };
  }

  // Sube la imagen de fondo. Si el curso ya tenía una plantilla, la
  // reemplaza (misma fila); si no, crea una nueva con fields vacío.
  async upload(courseId: string, file: UploadedFile) {
    const imageUrl = await this.cloudinary.uploadBuffer(
      file.buffer,
      'certificados/plantillas',
      'image',
    );

    const existingRaw = await this.drizzle.db
      .select()
      .from(templates)
      .where(eq(templates.courseId, courseId))
      .limit(1);

    if (existingRaw[0]) {
      await this.drizzle.db
        .update(templates)
        .set({ imageUrl, updatedAt: new Date().toISOString() })
        .where(eq(templates.id, existingRaw[0].id));
      return this.findOne(existingRaw[0].id);
    }

    const id = uuidv4();
    await this.drizzle.db.insert(templates).values({
      id,
      courseId,
      imageUrl,
      fields: JSON.stringify([]),
    });
    return this.findOne(id);
  }

  async updateFields(id: string, fields: any[]) {
    await this.findOne(id);
    await this.drizzle.db
      .update(templates)
      .set({ fields: JSON.stringify(fields), updatedAt: new Date().toISOString() })
      .where(eq(templates.id, id));
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.drizzle.db.delete(templates).where(eq(templates.id, id));
    return { message: 'Plantilla eliminada' };
  }
}