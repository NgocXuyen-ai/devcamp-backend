import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BattlesController } from './battles.controller';
import { BattlesService } from './battles.service';
import { BattlesGateway } from './battles.gateway';

import { Battle, BattleSchema } from './schemas/battle.schema';
import {
  BattleSubmission,
  BattleSubmissionSchema,
} from './schemas/battle-submission.schema';
import {
  UserRanking,
  UserRankingSchema,
} from '../users/schemas/user-ranking.schema';

import { MatchmakingService } from './matchmaking/matchmaking.service';
import { CodeExecutionModule } from '../code-execution/code-execution.module';
// import { MockQuestionsService } from './matchmaking/mock-questions.service';

import { QuestionsModule } from '../questions/questions.module';
import { MockQuestionsService } from './matchmaking/mock-questions.service';
import { NotificationsModule } from '../notifications/notification.module';
import { User, UserSchema } from '../users/schemas/users.schema';
import { GamificationService } from '../users/service/gamification.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Battle.name, schema: BattleSchema },
      { name: BattleSubmission.name, schema: BattleSubmissionSchema },
      { name: UserRanking.name, schema: UserRankingSchema },
      { name: User.name, schema: UserSchema },
    ]),
    QuestionsModule,
    CodeExecutionModule,
    NotificationsModule,
  ],
  controllers: [BattlesController],
  // GamificationService được khai báo lại ở đây thay vì import UsersModule,
  // theo đúng pattern đã dùng ở exercises.module.ts — tránh nguy cơ circular
  // dependency nếu sau này UsersModule (trực tiếp hoặc gián tiếp qua
  // ExercisesModule) cần import ngược lại BattlesModule. Service này chỉ
  // phụ thuộc User model, đã có sẵn trong MongooseModule.forFeature ở trên.
  providers: [
    BattlesService,
    BattlesGateway,
    MatchmakingService,
    CodeExecutionModule,
    GamificationService,
    // MockQuestionsService,
  ],
  exports: [BattlesService],
})
export class BattlesModule { }