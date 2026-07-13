import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from '../exercises/schemas/question.schema';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { QuestionGeneratorService } from './services/question-generator.service';
import { QUESTION_SERVICE } from './interfaces/question-service.token';
import { QUESTION_GENERATOR } from './interfaces/question-generator.token';
import { GroqQuestionGeneratorProvider } from './providers/groq-question-generator.provider';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
    ]),
  ],
  controllers: [QuestionsController],
  providers: [
    { provide: QUESTION_SERVICE, useClass: QuestionsService },
    { provide: QUESTION_GENERATOR, useClass: GroqQuestionGeneratorProvider },
    QuestionGeneratorService,
  ],
  exports: [QUESTION_SERVICE],
})
export class QuestionsModule {}
