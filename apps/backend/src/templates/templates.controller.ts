import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Roles('SUPER_ADMIN', 'STAFF')
  @Get()
  findAll() {
    return this.templatesService.findAll();
  }

  @Roles('SUPER_ADMIN', 'STAFF')
  @Get('course/:courseId')
  findByCourse(@Param('courseId') courseId: string) {
    return this.templatesService.findByCourse(courseId);
  }

  @Roles('SUPER_ADMIN', 'STAFF')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Roles('SUPER_ADMIN')
  @Post()
  create(@Body() body: { courseId: string; imageUrl: string; fields: object }) {
    return this.templatesService.create(body);
  }

  @Roles('SUPER_ADMIN')
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.templatesService.update(id, body);
  }

  @Roles('SUPER_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }
}