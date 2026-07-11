import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question } from '../exercises/schemas/question.schema';
import { CareerField } from '../common/enums';
import {
  IQuestion,
  IQuestionService,
} from '../battles/interfaces/question.interface';

@Injectable()
export class QuestionsService implements IQuestionService {
  constructor(
    @InjectModel(Question.name) private readonly questionModel: Model<Question>,
  ) {}

  async findRandomByCriteria(
    field: CareerField,
    difficulty: string,
    count: number,
  ): Promise<IQuestion[]> {
    const results = await this.questionModel.aggregate([
      { $match: { field, difficulty } },
      { $sample: { size: count } },
    ]);
    return results as IQuestion[];
  }

  async findById(id: string): Promise<IQuestion | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const doc = await this.questionModel.findById(id).lean();
    return doc;
  }
}
