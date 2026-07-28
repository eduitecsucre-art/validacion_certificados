import { Injectable } from '@nestjs/common';
import { drizzle, LibSQLDatabase } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './db/schema';

@Injectable()
export class DrizzleService {
  public db: LibSQLDatabase<typeof schema>;

  constructor() {
    const client = createClient({
      url: process.env.DATABASE_URL!,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });

    this.db = drizzle(client, { schema });
  }
}