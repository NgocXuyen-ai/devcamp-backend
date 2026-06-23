import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/users.schema';
import {
  LoginAttempt,
  LoginAttemptSchema,
} from './schemas/login-attempt.schema';
import { UserRanking, UserRankingSchema } from './schemas/user-ranking.schema';
import { UsersService } from './service/users.service';
import { GamificationService } from './service/gamification.service';
import { LoginAttemptService } from './service/login-attempt.service';
import { UserRankingService } from './service/ranking.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: LoginAttempt.name, schema: LoginAttemptSchema },
      { name: UserRanking.name, schema: UserRankingSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    GamificationService,
    LoginAttemptService,
    UserRankingService,
  ],
  exports: [
    UsersService,
    GamificationService,
    LoginAttemptService,
    UserRankingService,
    MongooseModule,
  ],
})
export class UsersModule {}
