import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { DrizzleService } from '../drizzle.service';

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, DrizzleService],
  exports: [TemplatesService],
})
export class TemplatesModule {}