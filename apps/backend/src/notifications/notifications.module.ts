import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { DrizzleService } from '../drizzle.service';

@Module({
  providers: [NotificationsService, DrizzleService],
  exports: [NotificationsService],
})
export class NotificationsModule {}