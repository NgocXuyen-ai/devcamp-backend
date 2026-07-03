import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { QuestionsService } from './services/questions.service';
import { Submission, SubmissionSchema } from './schemas/submission.schema';
import { Question, QuestionSchema } from './schemas/question.schema';

import { User, UserSchema } from '../users/schemas/users.schema';
import {
  RoadmapNode,
  RoadmapNodeSchema,
} from '../learning-path/schemas/roadmap-node.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Submission.name, schema: SubmissionSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: User.name, schema: UserSchema },
      { name: RoadmapNode.name, schema: RoadmapNodeSchema },
    ]),
  ],
  controllers: [ExercisesController],
  providers: [ExercisesService, QuestionsService],
  exports: [ExercisesService, QuestionsService],
})
export class ExercisesModule {}
