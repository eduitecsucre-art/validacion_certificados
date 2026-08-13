import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { DrizzleService } from '../drizzle.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [TemplatesController],
  providers: [TemplatesService, DrizzleService],
})
export class TemplatesModule {}