import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { NodeType } from '../../common/enums';
import { paginate } from '../../common/dto/pagination.dto';
import {
  RoadmapNode,
  RoadmapNodeDocument,
} from '../schemas/roadmap-node.schema';

export interface NodeListOptions {
  roadmapId: string;
  milestoneOrder?: number;
  type?: NodeType;
  isPublished?: boolean;
  page?: number;
  limit?: number;
  skip?: number;
}

@Injectable()
export class RoadmapNodeService {
  constructor(
    @InjectModel(RoadmapNode.name)
    private readonly model: Model<RoadmapNodeDocument>,
  ) {}

  async list(opts: NodeListOptions) {
    const filter: QueryFilter<RoadmapNodeDocument> = {
      roadmapId: new Types.ObjectId(opts.roadmapId),
    };
    if (opts.milestoneOrder !== undefined) {
      filter.milestoneOrder = opts.milestoneOrder;
    }
    if (opts.type) filter.type = opts.type;
    if (opts.isPublished !== undefined) filter.isPublished = opts.isPublished;

    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const skip = opts.skip ?? (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ milestoneOrder: 1, order: 1 })
        .skip(skip)
        .limit(limit),
      this.model.countDocuments(filter),
    ]);
    return paginate(items, total, page, limit);
  }

  async findById(id: Types.ObjectId): Promise<RoadmapNodeDocument> {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException('Node not found');
    return doc;
  }

  create(dto: Partial<RoadmapNode>): Promise<RoadmapNodeDocument> {
    return this.model.create(dto);
  }

  async update(
    id: Types.ObjectId,
    dto: Partial<RoadmapNode>,
  ): Promise<RoadmapNodeDocument> {
    const patch = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    );
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $set: patch },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Node not found');
    return doc;
  }

  async publish(
    id: Types.ObjectId,
    isPublished: boolean,
  ): Promise<RoadmapNodeDocument> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $set: { isPublished } },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Node not found');
    return doc;
  }

  async remove(id: Types.ObjectId): Promise<void> {
    const res = await this.model.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Node not found');
  }
}
