import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { QuestionsService } from './services/questions.service';
import { Submission, SubmissionSchema } from './schemas/submission.schema';
import { Question, QuestionSchema } from './schemas/question.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Submission.name, schema: SubmissionSchema },
      { name: Question.name, schema: QuestionSchema },
    ]),
  ],
  controllers: [ExercisesController],
  providers: [ExercisesService, QuestionsService],
  exports: [ExercisesService, QuestionsService],
})
export class ExercisesModule {}
