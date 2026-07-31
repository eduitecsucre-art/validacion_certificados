import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { DrizzleService } from '../drizzle.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, DrizzleService],
  exports: [NotificationsService],
})
export class NotificationsModule {}