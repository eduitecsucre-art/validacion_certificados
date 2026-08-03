import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { users } from './db/schema';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const db = drizzle(client);

async function seed() {
  const password = await bcrypt.hash('Admin123!', 10);

  await db.insert(users).values({
    id: uuidv4(),
    nombres: 'Super',
    apellidoPaterno: 'Administrador',
    apellidoMaterno: '',
    ci: '00000000',
    email: 'admin@sistema.com',
    password,
    celular: '',
    role: 'SUPER_ADMIN',
    active: true,
  });

  console.log('✅ Usuario SUPER_ADMIN creado');
  console.log('📧 Email: admin@sistema.com');
  console.log('🔑 Password: Admin123!');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});