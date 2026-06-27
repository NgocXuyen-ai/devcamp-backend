import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ErrorTrackingController } from './error-tracking.controller';
import { ErrorTrackingService } from './error-tracking.service';
import {
  ErrorTracking,
  ErrorTrackingSchema,
} from './schema/error-tracking.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ErrorTracking.name, schema: ErrorTrackingSchema },
    ]),
  ],
  controllers: [ErrorTrackingController],
  providers: [ErrorTrackingService],
  exports: [ErrorTrackingService],
})
export class ErrorTrackingModule {}
