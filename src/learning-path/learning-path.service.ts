import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NodeStatus } from '../common/enums';
import { RecallService } from '../recall/recall.service';

import { Roadmap } from './schemas/roadmap.schema';
import { RoadmapNode } from './schemas/roadmap-node.schema';
import { UserProgress } from './schemas/user-progress.schema';

import { CreateLearningPathDto } from './dto/create-learning-path.dto';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class LearningPathService {
  constructor(
    @InjectModel(Roadmap.name)
    private readonly roadmapModel: Model<Roadmap>,

    @InjectModel(RoadmapNode.name)
    private readonly nodeModel: Model<RoadmapNode>,

    @InjectModel(UserProgress.name)
    private readonly progressModel: Model<UserProgress>,

    private readonly recallService: RecallService,
  ) {}

  // =========================
  // ROADMAP
  // =========================

  async createPath(dto: CreateLearningPathDto) {
    return this.roadmapModel.create({
      title: dto.title,
      description: dto.description,
      field: dto.field,
      level: dto.level,
    });
  }

  async findAllPaths() {
    return this.roadmapModel.find();
  }

  async findPathById(pathId: string) {
    const path = await this.roadmapModel.findById(pathId);
    if (!path) throw new NotFoundException('Roadmap not found');
    return path;
  }

  // =========================
  // NODE
  // =========================

  async addNode(roadmapId: string, dto: CreateNodeDto) {
    await this.findPathById(roadmapId);

    return this.nodeModel.create({
      roadmapId: new Types.ObjectId(roadmapId),
      milestoneOrder: dto.milestoneOrder ?? 1,
      order: dto.order ?? 1,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      difficulty: dto.difficulty,

      content: {
        theory: dto.theory,
        videoUrl: dto.videoUrl,
        questionIds: dto.questionIds?.map((id) => new Types.ObjectId(id)) || [],
        labExerciseId: dto.labExerciseId
          ? new Types.ObjectId(dto.labExerciseId)
          : undefined,
      },
    });
  }

  async getNodes(roadmapId: string) {
    await this.findPathById(roadmapId);

    return this.nodeModel
      .find({ roadmapId: new Types.ObjectId(roadmapId) })
      .sort({ milestoneOrder: 1, order: 1 });
  }

  async getNodeById(nodeId: string) {
    const node = await this.nodeModel.findById(nodeId);
    if (!node) throw new NotFoundException('Node not found');
    return node;
  }

  // =========================
  // PROGRESS
  // =========================

  async updateProgress(
    user: { userId: string },
    nodeId: string,
    dto: UpdateProgressDto,
  ) {
    const node = await this.getNodeById(nodeId);

    const progress = await this.progressModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(user.userId),
        nodeId: new Types.ObjectId(nodeId),
      },
      {
        userId: new Types.ObjectId(user.userId),
        nodeId: new Types.ObjectId(nodeId),
        roadmapId: node.roadmapId,

        status: dto.status,
        score: dto.quizScore ?? 0,
      },
      { new: true, upsert: true },
    );

    if (dto.status === NodeStatus.COMPLETED) {
      await this.recallService.scheduleNodeRecall(
        new Types.ObjectId(user.userId),
        new Types.ObjectId(nodeId),
      );
    }

    return progress;
  }

  async getMyProgress(user: { userId: string }, roadmapId: string) {
    await this.findPathById(roadmapId);

    return this.progressModel.find({
      userId: new Types.ObjectId(user.userId),
      roadmapId: new Types.ObjectId(roadmapId),
    });
  }
}
