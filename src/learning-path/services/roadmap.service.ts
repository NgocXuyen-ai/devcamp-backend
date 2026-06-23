import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { CareerField, LessonLevel } from '../../common/enums';
import { paginate } from '../../common/dto/pagination.dto';
import { Milestone, Roadmap, RoadmapDocument } from '../schemas/roadmap.schema';

export interface RoadmapListOptions {
  field?: CareerField;
  level?: LessonLevel;
  isActive?: boolean;
  page?: number;
  limit?: number;
  skip?: number;
}

@Injectable()
export class RoadmapService {
  constructor(
    @InjectModel(Roadmap.name)
    private readonly model: Model<RoadmapDocument>,
  ) {}

  async list(opts: RoadmapListOptions) {
    const filter: QueryFilter<RoadmapDocument> = {};
    if (opts.field) filter.field = opts.field;
    if (opts.level) filter.level = opts.level;
    if (opts.isActive !== undefined) filter.isActive = opts.isActive;

    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const skip = opts.skip ?? (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.model.countDocuments(filter),
    ]);
    return paginate(items, total, page, limit);
  }

  async findById(id: Types.ObjectId): Promise<RoadmapDocument> {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException('Roadmap not found');
    return doc;
  }

  create(dto: Partial<Roadmap>): Promise<RoadmapDocument> {
    return this.model.create(dto);
  }

  async update(
    id: Types.ObjectId,
    dto: Partial<Roadmap>,
  ): Promise<RoadmapDocument> {
    // Drop undefined keys so a partial update doesn't wipe fields.
    const patch = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    );
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $set: patch },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Roadmap not found');
    return doc;
  }

  async publishNewVersion(id: Types.ObjectId): Promise<RoadmapDocument> {
    const roadmap = await this.findById(id);
    await this.model.updateMany(
      {
        _id: { $ne: roadmap._id },
        field: roadmap.field,
        level: roadmap.level,
      },
      { $set: { isActive: false } },
    );
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $set: { isActive: true }, $inc: { version: 1 } },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Roadmap not found');
    return doc;
  }

  async setActive(
    id: Types.ObjectId,
    isActive: boolean,
  ): Promise<RoadmapDocument> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Roadmap not found');
    return doc;
  }

  async remove(id: Types.ObjectId): Promise<void> {
    const res = await this.model.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Roadmap not found');
  }

  // ----- milestones -----

  async addMilestone(
    id: Types.ObjectId,
    milestone: Partial<Milestone>,
  ): Promise<RoadmapDocument> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $push: { milestones: milestone } },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Roadmap not found');
    return doc;
  }

  async removeMilestone(
    id: Types.ObjectId,
    order: number,
  ): Promise<RoadmapDocument> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $pull: { milestones: { order } } },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Roadmap not found');
    return doc;
  }
}
