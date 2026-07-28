import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('certificates')
export class CertificatesController {
  constructor(private certificatesService: CertificatesService) {}

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'STAFF')
  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.certificatesService.create({ ...body, issuedById: req.user.id });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Delete(':id')
  revoke(@Param('id') id: string) {
    return this.certificatesService.revoke(id);
  }
}