import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleService } from './drizzle.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { TemplatesModule } from './templates/templates.module';
import { CertificatesModule } from './certificates/certificates.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        // Límite general por defecto para toda la API: 60 peticiones
        // por minuto por IP. Generoso, solo evita abuso masivo.
        name: 'default',
        ttl: 60000,
        limit: 60,
      },
    ]),
    AuthModule,
    UsersModule,
    CoursesModule,
    TemplatesModule,
    CertificatesModule,
    NotificationsModule,
    EnrollmentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    DrizzleService,
    // Aplica el throttling globalmente a todos los endpoints por defecto.
    // El límite más estricto de login se define aparte, directo en esa ruta.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}