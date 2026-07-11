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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Battle.name, schema: BattleSchema },
      { name: BattleSubmission.name, schema: BattleSubmissionSchema },
      { name: UserRanking.name, schema: UserRankingSchema },
    ]),
    QuestionsModule,
    CodeExecutionModule,
  ],
  controllers: [BattlesController],
  providers: [
    BattlesService,
    BattlesGateway,
    MatchmakingService,
    CodeExecutionModule,
    // MockQuestionsService,
  ],
  exports: [BattlesService],
})
export class BattlesModule {}
