import { Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { PdfGeneratorService } from './pdf-generator.service';
import { DrizzleService } from '../drizzle.service';
import { TemplatesModule } from '../templates/templates.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [TemplatesModule, CloudinaryModule],
  controllers: [CertificatesController],
  providers: [CertificatesService, PdfGeneratorService, DrizzleService],
  exports: [CertificatesService],
})
export class CertificatesModule {}