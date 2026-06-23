import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateQuestionDto } from '../dto/question.dto';
import { Question, QuestionDocument } from '../schemas/question.schema';

/**
 * Question bank CRUD shared by the admin dashboard and (later) the
 * learning/battle/recall modules.
 */
@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question.name)
    private readonly model: Model<QuestionDocument>,
  ) {}

  /** Admin-facing read — returns the full document (incl. answer keys). */
  async findByIdInternal(id: Types.ObjectId): Promise<QuestionDocument> {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException('Question not found');
    return doc;
  }

  create(
    dto: CreateQuestionDto,
    createdBy: Types.ObjectId,
  ): Promise<QuestionDocument> {
    return this.model.create({ ...dto, createdBy });
  }

  async update(
    id: Types.ObjectId,
    dto: Partial<CreateQuestionDto>,
  ): Promise<QuestionDocument> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Question not found');
    return doc;
  }

  async remove(id: Types.ObjectId): Promise<void> {
    const res = await this.model.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Question not found');
  }
}
