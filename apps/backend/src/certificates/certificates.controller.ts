import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('certificates')
export class CertificatesController {
  constructor(private certificatesService: CertificatesService) { }

  @Get('verify/:code')
  verifyByCode(@Param('code') code: string) {
    return this.certificatesService.findByCode(code);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'STAFF')
  @Get()
  findAll() {
    return this.certificatesService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'STAFF')
  @Post(':id/resend-email')
  resendEmail(@Param('id') id: string) {
    return this.certificatesService.resendIssuanceEmail(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMy(@Request() req: any) {
    return this.certificatesService.findByStudent(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'STAFF')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.certificatesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/download')
  async download(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
    const { buffer, filename } = await this.certificatesService.getDownloadableFile(id, req.user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'STAFF')
  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.certificatesService.create({ ...body, issuedById: req.user.id });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'STAFF')
  @Post('many')
  createMany(@Body() body: any, @Request() req: any) {
    return this.certificatesService.createMany({ ...body, issuedById: req.user.id });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Delete(':id')
  revoke(@Param('id') id: string) {
    return this.certificatesService.revoke(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.certificatesService.reactivate(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Delete(':id/permanent')
  remove(@Param('id') id: string) {
    return this.certificatesService.remove(id);
  }

  @Get('public/ci/:ci')
  findByCI(@Param('ci') ci: string) {
    return this.certificatesService.findByCI(ci);
  }

  @Get('public/:id/download')
  async downloadPublic(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename } = await this.certificatesService.getPublicDownloadableFile(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  }

}