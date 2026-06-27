import { Test, TestingModule } from '@nestjs/testing';
import { PenaltiesService } from './penalty.service';
import { getModelToken } from '@nestjs/mongoose';
import { Penalty } from './schemas/penalty.schema';
import { ErrorTrackingService } from '../error-tracking/error-tracking.service';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('PenaltiesService', () => {
  let service: PenaltiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PenaltiesService,
        {
          provide: getModelToken(Penalty.name),
          useValue: {},
        },
        {
          provide: ErrorTrackingService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PenaltiesService>(PenaltiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
