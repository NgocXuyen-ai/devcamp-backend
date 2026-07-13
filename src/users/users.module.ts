import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExercisesModule } from '../exercises/exercises.module';
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
    // Dùng ExercisesService.getProgressSummary()/getActivityCalendar() để
    // gộp vào GET /me/summary — tránh FE phải gọi 3-4 API riêng lẻ.
    ExercisesModule,
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
export class UsersModule { }
