import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { QuestionsService } from './services/questions.service';
import { Submission, SubmissionSchema } from './schemas/submission.schema';
import { Question, QuestionSchema } from './schemas/question.schema';

import { User, UserSchema } from '../users/schemas/users.schema';
import { GamificationService } from '../users/service/gamification.service';
import {
  RoadmapNode,
  RoadmapNodeSchema,
} from '../learning-path/schemas/roadmap-node.schema';
import { NotificationsModule } from '../notifications/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Submission.name, schema: SubmissionSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: User.name, schema: UserSchema },
      { name: RoadmapNode.name, schema: RoadmapNodeSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [ExercisesController],
  // GamificationService được khai báo lại ở đây (không import UsersModule)
  // vì UsersModule đã import ExercisesModule — import ngược lại sẽ tạo
  // circular dependency. Service này chỉ phụ thuộc User model, vốn đã có
  // sẵn trong MongooseModule.forFeature ở trên, nên an toàn khi khai báo
  // độc lập ở 2 module.
  providers: [ExercisesService, QuestionsService, GamificationService],
  exports: [ExercisesService, QuestionsService],
})
export class ExercisesModule { }