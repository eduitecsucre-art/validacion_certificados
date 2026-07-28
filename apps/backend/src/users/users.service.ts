import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DrizzleService } from '../drizzle.service';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(private drizzle: DrizzleService) {}

  async findAll() {
    return this.drizzle.db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
    }).from(users);
  }

  async findOne(id: string) {
    const result = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!result[0]) throw new NotFoundException('Usuario no encontrado');
    return result[0];
  }

  async create(data: { name: string; email: string; password: string; role: string }) {
    const existing = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);
    if (existing[0]) throw new ConflictException('El email ya está registrado');

    const hashed = await bcrypt.hash(data.password, 10);
    const id = uuidv4();

    await this.drizzle.db.insert(users).values({
      id,
      name: data.name,
      email: data.email,
      password: hashed,
      role: data.role,
    });

    return { id, name: data.name, email: data.email, role: data.role };
  }

  async update(id: string, data: Partial<{ name: string; email: string; password: string; active: boolean }>) {
    await this.findOne(id);
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    await this.drizzle.db.update(users).set(data).where(eq(users.id, id));
    return this.findOne(id);
  }

  async deactivate(id: string) {
    await this.findOne(id);
    await this.drizzle.db.update(users).set({ active: false }).where(eq(users.id, id));
    return { message: 'Usuario desactivado' };
  }
}