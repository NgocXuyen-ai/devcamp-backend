import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from '../exercises/schemas/question.schema';
import {
  SurveyResponse,
  SurveyResponseSchema,
} from './schemas/survey-response.schema';
import { SkillTestService } from './skill-test.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: SurveyResponse.name, schema: SurveyResponseSchema },
    ]),
  ],
  providers: [SkillTestService],
  exports: [SkillTestService],
})
export class SurveyModule {}
