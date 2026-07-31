import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DrizzleService } from '../drizzle.service';
import { notifications } from '../db/schema';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private drizzle: DrizzleService) {}

  @Roles('SUPER_ADMIN', 'STAFF')
  @Get()
  findAll() {
    return this.drizzle.db.select().from(notifications);
  }
}