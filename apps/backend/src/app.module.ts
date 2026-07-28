import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleService } from './drizzle.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { TemplatesModule } from './templates/templates.module';

@Module({
  imports: [AuthModule, UsersModule, CoursesModule, TemplatesModule],
  controllers: [AppController],
  providers: [AppService, DrizzleService],
})
export class AppModule {}