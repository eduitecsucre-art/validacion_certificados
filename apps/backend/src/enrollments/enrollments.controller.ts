import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  @Roles('SUPER_ADMIN', 'STAFF')
  @Get('course/:courseId')
  findByCourse(@Param('courseId') courseId: string) {
    return this.enrollmentsService.findByCourse(courseId);
  }

  @Roles('SUPER_ADMIN', 'STAFF', 'STUDENT')
  @Get('student/:studentId')
  findByStudent(@Param('studentId') studentId: string) {
    return this.enrollmentsService.findByStudent(studentId);
  }

  @Roles('SUPER_ADMIN', 'STAFF')
  @Post()
  enroll(@Body() body: { studentId: string; courseId: string }) {
    return this.enrollmentsService.enroll(body.studentId, body.courseId);
  }

  @Roles('SUPER_ADMIN', 'STAFF')
  @Post('many')
  enrollMany(@Body() body: { studentIds: string[]; courseId: string }) {
    return this.enrollmentsService.enrollMany(body.studentIds, body.courseId);
  }

  @Roles('SUPER_ADMIN', 'STAFF')
  @Delete(':id')
  unenroll(@Param('id') id: string) {
    return this.enrollmentsService.unenroll(id);
  }
}