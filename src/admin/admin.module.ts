import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersModule } from '../users/users.module';
import { ExercisesModule } from '../exercises/exercises.module';
import { LearningPathModule } from '../learning-path/learning-path.module';

import { User, UserSchema } from '../users/schemas/users.schema';
import {
  Submission,
  SubmissionSchema,
} from '../exercises/schemas/submission.schema';
import { Question, QuestionSchema } from '../exercises/schemas/question.schema';
import { AdminConfig, AdminConfigSchema } from './schema/admin-config.schema';

import { AdminUsersController } from './controller/admin-users.controller';
import {
  AdminRoadmapsController,
  AdminNodesController,
} from './controller/admin-roadmaps.controller';
import { AdminQuestionsController } from './controller/admin-questions.controller';
import { AdminConfigsController } from './controller/admin-configs.controller';
import {
  AdminAiMentorController,
  AdminAnalyticsController,
} from './controller/admin-other.controller';

import { AdminUsersService } from './service/admin-users.service';
import { AdminRoadmapsService } from './service/admin-roadmaps.service';
import { AdminQuestionsService } from './service/admin-questions.service';
import { AdminConfigService } from './service/admin-configs.service';
import { AdminAiMentorService } from './service/admin-ai-mentor.service';
import { AdminAnalyticsService } from './service/admin-analytics.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminConfig.name, schema: AdminConfigSchema },
      { name: User.name, schema: UserSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Question.name, schema: QuestionSchema },
    ]),
    UsersModule,
    ExercisesModule,
    LearningPathModule,
  ],
  controllers: [
    AdminUsersController,
    AdminRoadmapsController,
    AdminNodesController,
    AdminQuestionsController,
    AdminConfigsController,
    AdminAiMentorController,
    AdminAnalyticsController,
  ],
  providers: [
    AdminUsersService,
    AdminRoadmapsService,
    AdminQuestionsService,
    AdminConfigService,
    AdminAiMentorService,
    AdminAnalyticsService,
  ],
  exports: [AdminConfigService],
})
export class AdminModule {}
