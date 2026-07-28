import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { DrizzleService } from '../drizzle.service';

@Module({
  controllers: [CoursesController],
  providers: [CoursesService, DrizzleService],
  exports: [CoursesService],
})
export class CoursesModule {}