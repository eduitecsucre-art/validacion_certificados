import { Module } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { DrizzleService } from '../drizzle.service';

@Module({
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService, DrizzleService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}