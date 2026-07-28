import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleService } from './drizzle.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { TemplatesModule } from './templates/templates.module';
import { CertificatesModule } from './certificates/certificates.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    CoursesModule,
    TemplatesModule,
    CertificatesModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, DrizzleService],
})
export class AppModule {}