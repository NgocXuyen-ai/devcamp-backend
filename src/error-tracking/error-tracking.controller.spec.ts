import { Test, TestingModule } from '@nestjs/testing';
import { ErrorTrackingController } from './error-tracking.controller';
import { ErrorTrackingService } from './error-tracking.service';
import { getModelToken } from '@nestjs/mongoose';
import { ErrorTracking } from './schema/error-tracking.schema';
import { describe, beforeEach, it, expect } from '@jest/globals';
describe('ErrorTrackingController', () => {
  let controller: ErrorTrackingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ErrorTrackingController],
      providers: [
        ErrorTrackingService,
        {
          provide: getModelToken(ErrorTracking.name),
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ErrorTrackingController>(ErrorTrackingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
