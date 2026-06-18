import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from '../exercises/schemas/question.schema';
import {
  RoadmapNode,
  RoadmapNodeSchema,
} from '../learning-path/schemas/roadmap-node.schema';
import {
  UserProgress,
  UserProgressSchema,
} from '../learning-path/schemas/user-progress.schema';
import { Penalty, PenaltySchema } from '../penalties/schemas/penalty.schema';
import { RecallController } from './recall.controller';
import { RecallService } from './recall.service';
import { Recall, RecallSchema } from './schemas/recall.schema';
import { RecallTest, RecallTestSchema } from './schemas/recall-test.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recall.name, schema: RecallSchema },
      { name: RecallTest.name, schema: RecallTestSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: RoadmapNode.name, schema: RoadmapNodeSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
      { name: Penalty.name, schema: PenaltySchema },
    ]),
  ],
  controllers: [RecallController],
  providers: [RecallService],
  exports: [RecallService],
})
export class RecallModule {}
