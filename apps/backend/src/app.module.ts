import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleService } from './drizzle.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, DrizzleService],
})
export class AppModule {}