import { Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { DrizzleService } from '../drizzle.service';

@Module({
  controllers: [CertificatesController],
  providers: [CertificatesService, DrizzleService],
  exports: [CertificatesService],
})
export class CertificatesModule {}