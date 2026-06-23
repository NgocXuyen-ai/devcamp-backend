import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

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
  ) {}

  // =========================
  // ROADMAP
  // =========================

  async createPath(dto: CreateLearningPathDto) {
    return this.roadmapModel.create({
      title: dto.title,
      description: dto.description,
      field: dto.field,
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
    userId: Types.ObjectId,
    nodeId: string,
    dto: UpdateProgressDto,
  ) {
    const node = await this.getNodeById(nodeId);

    return this.progressModel.findOneAndUpdate(
      {
        userId,
        nodeId: new Types.ObjectId(nodeId),
      },
      {
        userId,
        nodeId: new Types.ObjectId(nodeId),
        roadmapId: node.roadmapId,

        status: dto.status,
        score: dto.quizScore ?? 0,
      },
      { new: true, upsert: true },
    );
  }

  async getMyProgress(userId: Types.ObjectId, roadmapId: string) {
    await this.findPathById(roadmapId);

    return this.progressModel.find({
      userId,
      roadmapId: new Types.ObjectId(roadmapId),
    });
  }
}
