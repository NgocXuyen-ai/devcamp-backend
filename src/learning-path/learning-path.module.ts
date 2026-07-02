import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LearningPathController } from './learning-path.controller';
import { LearningPathService } from './learning-path.service';
import { RoadmapService } from './services/roadmap.service';
import { RoadmapNodeService } from './services/roadmap-node.service';

import { Roadmap, RoadmapSchema } from './schemas/roadmap.schema';
import { RoadmapNode, RoadmapNodeSchema } from './schemas/roadmap-node.schema';

import {
  UserProgress,
  UserProgressSchema,
} from './schemas/user-progress.schema';
import {
  LearningHistory,
  LearningHistorySchema,
} from '../history/schemas/learning-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Roadmap.name, schema: RoadmapSchema },
      { name: RoadmapNode.name, schema: RoadmapNodeSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
      { name: LearningHistory.name, schema: LearningHistorySchema },
    ]),
  ],
  controllers: [LearningPathController],
  providers: [LearningPathService, RoadmapService, RoadmapNodeService],
  exports: [LearningPathService, RoadmapService, RoadmapNodeService],
})
export class LearningPathModule {}
