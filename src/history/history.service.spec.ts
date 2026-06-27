import { Test, TestingModule } from '@nestjs/testing';
import { HistoryService } from './history.service';
import { getModelToken } from '@nestjs/mongoose';
import { LearningHistory } from './schemas/learning-history.schema';
import { Bookmark } from './schemas/bookmark.schema';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('HistoryService', () => {
  let service: HistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryService,
        {
          provide: getModelToken(LearningHistory.name),
          useValue: {},
        },
        {
          provide: getModelToken(Bookmark.name),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<HistoryService>(HistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
