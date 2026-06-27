import { Test, TestingModule } from '@nestjs/testing';
import { ErrorTrackingService } from './error-tracking.service';
import { getModelToken } from '@nestjs/mongoose';
import { ErrorTracking } from './schema/error-tracking.schema';
import { describe, beforeEach, it, expect } from '@jest/globals';
describe('ErrorTrackingService', () => {
  let service: ErrorTrackingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErrorTrackingService,
        {
          provide: getModelToken(ErrorTracking.name),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ErrorTrackingService>(ErrorTrackingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
