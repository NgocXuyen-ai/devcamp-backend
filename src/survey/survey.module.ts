import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from '../exercises/schemas/question.schema';
import { UsersModule } from '../users/users.module';
import {
  SurveyResponse,
  SurveyResponseSchema,
} from './schemas/survey-response.schema';
import { CodeRunnerService } from './service/code-runner.service';
import { SkillTestService } from './service/skill-test.service';
import { SurveyService } from './service/survey.service';
import { SurveyController } from './survey.controller';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: SurveyResponse.name, schema: SurveyResponseSchema },

      { name: Question.name, schema: QuestionSchema },
    ]),
  ],
  controllers: [SurveyController],
  providers: [SurveyService, SkillTestService, CodeRunnerService],
  exports: [SurveyService, SkillTestService, CodeRunnerService],
})
export class SurveyModule {}
