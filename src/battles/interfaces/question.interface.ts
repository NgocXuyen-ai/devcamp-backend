import { Types } from 'mongoose';
import { CareerField } from '../../common/enums';

export interface IQuestion {
  _id: Types.ObjectId | string;
  title: string;
  content: string;
  field: CareerField;
  difficulty: string;
  type?: string;
  testCases?: any[];
  templates?: any[];
  correctAnswer?: string;
}

export interface IQuestionService {
  findRandomByCriteria(
    field: CareerField,
    difficulty: string,
    count: number,
  ): Promise<IQuestion[]>;
  findById(id: string): Promise<IQuestion | null>;
}
