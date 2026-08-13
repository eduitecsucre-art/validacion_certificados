import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DrizzleService } from '../drizzle.service';
import { users } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(private drizzle: DrizzleService) {}

  private fullName(user: any): string {
    return `${user.apellidoPaterno} ${user.apellidoMaterno ?? ''} ${user.nombres}`.trim();
  }

  // Quita el hash de password antes de devolver el usuario al cliente.
  // Nunca debe viajar en ninguna respuesta HTTP, aunque sea hasheado.
  private sanitize(user: any) {
    const { password, ...safe } = user;
    return { ...safe, fullName: this.fullName(user) };
  }

  async findAll() {
    const result = await this.drizzle.db
      .select()
      .from(users)
      .orderBy(asc(users.apellidoPaterno), asc(users.apellidoMaterno), asc(users.nombres));
    return result.map(u => this.sanitize(u));
  }

  async findOne(id: string) {
    const result = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!result[0]) throw new NotFoundException('Usuario no encontrado');
    return this.sanitize(result[0]);
  }

  async create(data: {
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
    ci?: string;
    email: string;
    password: string;
    celular?: string;
    role: string;
  }) {
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
      nombres: data.nombres,
      apellidoPaterno: data.apellidoPaterno,
      apellidoMaterno: data.apellidoMaterno,
      ci: data.ci,
      email: data.email,
      password: hashed,
      celular: data.celular,
      role: data.role,
    });

    return this.findOne(id);
  }

  async update(id: string, data: Partial<{
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    ci: string;
    email: string;
    password: string;
    celular: string;
    active: boolean;
  }>) {
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