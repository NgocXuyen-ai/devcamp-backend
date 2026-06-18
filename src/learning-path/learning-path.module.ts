import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecallModule } from '../recall/recall.module';

import { LearningPathController } from './learning-path.controller';
import { LearningPathService } from './learning-path.service';

import { Roadmap, RoadmapSchema } from './schemas/roadmap.schema';
import { RoadmapNode, RoadmapNodeSchema } from './schemas/roadmap-node.schema';

import {
  UserProgress,
  UserProgressSchema,
} from './schemas/user-progress.schema';

@Module({
  imports: [
    RecallModule,
    MongooseModule.forFeature([
      { name: Roadmap.name, schema: RoadmapSchema },
      { name: RoadmapNode.name, schema: RoadmapNodeSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
    ]),
  ],
  controllers: [LearningPathController],
  providers: [LearningPathService],
})
export class LearningPathModule {}
