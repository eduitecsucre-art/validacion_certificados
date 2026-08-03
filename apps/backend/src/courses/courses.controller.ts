import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) { }

  @Roles('SUPER_ADMIN', 'STAFF')
  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @Roles('SUPER_ADMIN', 'STAFF')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Roles('SUPER_ADMIN')
  @Post()
  create(@Body() body: { name: string; description?: string; instructor: string; hours: number; validityDays?: number }) {
    return this.coursesService.create(body);
  }

  @Roles('SUPER_ADMIN')
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.coursesService.update(id, body);
  }

  @Roles('SUPER_ADMIN')
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.coursesService.deactivate(id);
  }
}