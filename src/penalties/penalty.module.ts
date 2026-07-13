import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PenaltiesController } from './penalty.controller';
import { PenaltiesService } from './penalty.service';
import { Penalty, PenaltySchema } from './schemas/penalty.schema';
import { ErrorTrackingModule } from '../error-tracking/error-tracking.module';
import { NotificationsModule } from '../notifications/notification.module';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Penalty.name, schema: PenaltySchema }]),
    ErrorTrackingModule,
    NotificationsModule,
  ],
  controllers: [PenaltiesController],
  providers: [PenaltiesService],
  exports: [PenaltiesService],
})
export class PenaltiesModule { }