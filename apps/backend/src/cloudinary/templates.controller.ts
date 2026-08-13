import {
  Controller, Get, Post, Put, Delete,
  Body, Param, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface UploadedFileData {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private templatesService: TemplatesService) { }

  @Roles('SUPER_ADMIN', 'STAFF')
  @Get('course/:courseId')
  findByCourse(@Param('courseId') courseId: string) {
    return this.templatesService.findByCourse(courseId);
  }

  @Roles('SUPER_ADMIN', 'STAFF')
  @Post('course/:courseId/upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@Param('courseId') courseId: string, @UploadedFile() file: UploadedFileData) {
    return this.templatesService.upload(courseId, file);
  }

  @Roles('SUPER_ADMIN', 'STAFF')
  @Put(':id/fields')
  updateFields(@Param('id') id: string, @Body() body: { fields: any[] }) {
    return this.templatesService.updateFields(id, body.fields);
  }

  @Roles('SUPER_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }
}