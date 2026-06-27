import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { HistoryController } from './history.controller';
import { MeHistoryController } from './me-history.controller';
import { HistoryService } from './history.service';

import {
  LearningHistory,
  LearningHistorySchema,
} from './schemas/learning-history.schema';
import { Bookmark, BookmarkSchema } from './schemas/bookmark.schema';
import {
  UserProgress,
  UserProgressSchema,
} from '../learning-path/schemas/user-progress.schema';
import {
  RoadmapNode,
  RoadmapNodeSchema,
} from '../learning-path/schemas/roadmap-node.schema';
import { Battle, BattleSchema } from '../battles/schemas/battle.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LearningHistory.name, schema: LearningHistorySchema },
      { name: Bookmark.name, schema: BookmarkSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
      { name: RoadmapNode.name, schema: RoadmapNodeSchema },
      { name: Battle.name, schema: BattleSchema },
    ]),
  ],
  controllers: [HistoryController, MeHistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
