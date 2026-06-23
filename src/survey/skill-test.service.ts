import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CareerField, LessonLevel, QuestionType } from '../common/enums';
import {
  Question,
  QuestionDocument,
} from '../exercises/schemas/question.schema';

export interface QuickTestQuestion {
  _id: Types.ObjectId;
  title: string;
  content: string;
  type: QuestionType;
  options: { text: string }[]; // hide isCorrect from client
  timeLimitSeconds: number;
}

export interface GradeResult {
  correctCount: number;
  totalCount: number;
  scorePercent: number;
  computedEntryLevel: LessonLevel;
  perAnswer: Array<{ questionId: Types.ObjectId; isCorrect: boolean }>;
}

@Injectable()
export class SkillTestService {
  constructor(
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
  ) {}

  async pickQuickTestQuestions(
    field: CareerField,
    count = 5,
  ): Promise<QuickTestQuestion[]> {
    const docs = await this.questionModel.aggregate<QuestionDocument>([
      {
        $match: {
          field,
          type: QuestionType.MULTIPLE_CHOICE,
          isPublished: true,
        },
      },
      { $sample: { size: count } },
    ]);
    return docs.map((q) => ({
      _id: q._id,
      title: q.title,
      content: q.content,
      type: q.type,
      timeLimitSeconds: q.timeLimitSeconds ?? 30,
      options: q.options.map((o) => ({ text: o.text })),
    }));
  }

  async grade(
    answers: Array<{ questionId: string; answer: string }>,
  ): Promise<GradeResult> {
    const ids = answers.map((a) => new Types.ObjectId(a.questionId));
    const questions = await this.questionModel.find({ _id: { $in: ids } });
    const map = new Map(questions.map((q) => [q._id.toString(), q]));

    const perAnswer = answers.map((a) => {
      const q = map.get(a.questionId);
      if (!q)
        return {
          questionId: new Types.ObjectId(a.questionId),
          isCorrect: false,
        };
      const correctTexts = q.options
        .filter((o) => o.isCorrect)
        .map((o) => o.text);
      const isCorrect = correctTexts.includes(a.answer);
      return { questionId: q._id, isCorrect };
    });

    const correctCount = perAnswer.filter((x) => x.isCorrect).length;
    const totalCount = answers.length;
    const scorePercent = totalCount ? (correctCount / totalCount) * 100 : 0;

    const computedEntryLevel: LessonLevel =
      scorePercent >= 80
        ? LessonLevel.ADVANCED
        : scorePercent >= 60
          ? LessonLevel.INTERMEDIATE
          : LessonLevel.ROOT;

    return {
      correctCount,
      totalCount,
      scorePercent,
      computedEntryLevel,
      perAnswer,
    };
  }
}
