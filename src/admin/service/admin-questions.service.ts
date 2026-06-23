import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { paginate } from '../../common/dto/pagination.dto';
import {
  CreateQuestionDto,
  QuestionFilterDto,
} from '../../exercises/dto/question.dto';
import {
  Question,
  QuestionDocument,
} from '../../exercises/schemas/question.schema';
import { QuestionsService } from '../../exercises/services/questions.service';
import { BulkImportQuestionsDto } from '../dto/admin-config.dto';

export interface BulkImportResult {
  inserted: number;
  skipped: number;
  failed: Array<{ index: number; title: string; reason: string }>;
}

@Injectable()
export class AdminQuestionsService {
  private readonly logger = new Logger(AdminQuestionsService.name);

  constructor(
    private readonly questions: QuestionsService,
    @InjectModel(Question.name)
    private readonly model: Model<QuestionDocument>,
  ) {}

  // ----- read (admin sees unpublished too) -----

  async list(q: QuestionFilterDto) {
    const filter: QueryFilter<QuestionDocument> = {};
    if (q.field) filter.field = q.field;
    if (q.difficulty) filter.difficulty = q.difficulty;
    if (q.type) filter.type = q.type;
    if (q.tag) filter.tags = q.tag;
    if (q.category) filter.category = q.category;
    if (q.search) filter.title = { $regex: q.search, $options: 'i' };

    const limit = q.limit ?? 20;
    const page = q.page ?? 1;
    const skip = q.skip;

    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.model.countDocuments(filter),
    ]);
    return paginate(items, total, page, limit);
  }

  getById(id: Types.ObjectId) {
    return this.questions.findByIdInternal(id);
  }

  // ----- write -----

  create(dto: CreateQuestionDto, createdBy: Types.ObjectId) {
    return this.questions.create(dto, createdBy);
  }

  update(id: Types.ObjectId, dto: Partial<CreateQuestionDto>) {
    return this.questions.update(id, dto);
  }

  remove(id: Types.ObjectId) {
    return this.questions.remove(id);
  }

  async setPublished(
    id: Types.ObjectId,
    isPublished: boolean,
  ): Promise<QuestionDocument> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $set: { isPublished } },
      { new: true },
    );
    if (!doc) throw new Error('Question not found');
    return doc;
  }

  // ----- bulk import -----

  async bulkImport(
    dto: BulkImportQuestionsDto,
    createdBy: Types.ObjectId,
  ): Promise<BulkImportResult> {
    const result: BulkImportResult = {
      inserted: 0,
      skipped: 0,
      failed: [],
    };
    const skipDuplicates = dto.skipDuplicates ?? true;

    for (let i = 0; i < dto.questions.length; i++) {
      const q = dto.questions[i];
      try {
        if (skipDuplicates) {
          const exists = await this.model.exists({ title: q.title });
          if (exists) {
            result.skipped += 1;
            continue;
          }
        }
        await this.questions.create(q, createdBy);
        result.inserted += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Bulk import row ${i} failed: ${message}`);
        result.failed.push({ index: i, title: q.title, reason: message });
      }
    }
    return result;
  }
}
