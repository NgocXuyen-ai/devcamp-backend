import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Roadmap } from './schemas/roadmap.schema';
import { RoadmapNode } from './schemas/roadmap-node.schema';
import { UserProgress } from './schemas/user-progress.schema';
import { LearningHistory } from '../history/schemas/learning-history.schema';

import { CreateLearningPathDto } from './dto/create-learning-path.dto';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import {
  CareerField,
  HistoryAction,
  LessonLevel,
  NodeStatus,
} from '../common/enums';

const ROADMAP_STAGE_SIZE = 10;
type RoadmapWithId = Roadmap & { _id: Types.ObjectId };

@Injectable()
export class LearningPathService {
  constructor(
    @InjectModel(Roadmap.name)
    private readonly roadmapModel: Model<Roadmap>,

    @InjectModel(RoadmapNode.name)
    private readonly nodeModel: Model<RoadmapNode>,

    @InjectModel(UserProgress.name)
    private readonly progressModel: Model<UserProgress>,

    @InjectModel(LearningHistory.name)
    private readonly historyModel: Model<LearningHistory>,
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
    const now = new Date();
    const isCompleted = dto.status === NodeStatus.COMPLETED;

    const progress = await this.progressModel.findOneAndUpdate(
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
        lastAttemptAt: now,
        // Chỉ stamp completedAt khi thực sự hoàn thành để tab Finished hiển thị đúng ngày.
        ...(isCompleted ? { completedAt: now } : {}),
        $inc: { submitCount: 1 },
      },
      { new: true, upsert: true },
    );

    // Ghi vào LearningHistory để feed tab Activity (best-effort, không chặn progress).
    try {
      await this.historyModel.create({
        userId,
        action: isCompleted
          ? HistoryAction.LESSON_COMPLETED
          : HistoryAction.SUBMISSION_MADE,
        nodeId: new Types.ObjectId(nodeId),
        score: dto.quizScore ?? 0,
        metadata: { title: node.title, status: dto.status },
      });
    } catch {
      // Activity feed là phụ — lỗi ghi history không được làm hỏng việc lưu progress.
    }

    return progress;
  }

  async getMyProgress(userId: Types.ObjectId, roadmapId: string) {
    await this.findPathById(roadmapId);

    return this.progressModel.find({
      userId,
      roadmapId: new Types.ObjectId(roadmapId),
    });
  }

  async syncSurveyPlacement(
    userId: Types.ObjectId,
    entryLevel: LessonLevel,
    fieldFocus?: CareerField,
  ): Promise<void> {
    const fieldsToSync: CareerField[] = [];
    if (fieldFocus === CareerField.FULLSTACK || !fieldFocus) {
      fieldsToSync.push(CareerField.FRONTEND, CareerField.BACKEND);
    } else if (fieldFocus === CareerField.FRONTEND) {
      fieldsToSync.push(CareerField.FRONTEND);
    } else if (fieldFocus === CareerField.BACKEND) {
      fieldsToSync.push(CareerField.BACKEND);
    }

    const roadmaps = await this.roadmapModel
      .find({
        field: {
          $in: fieldsToSync,
        },
        isActive: true,
      })
      .sort({ createdAt: -1 });

    const selectedRoadmaps: RoadmapWithId[] = [];
    for (const field of fieldsToSync) {
      const roadmap = roadmaps.find((item) => item.field === field);
      if (roadmap) {
        selectedRoadmaps.push(roadmap as RoadmapWithId);
      }
    }

    await Promise.all(
      selectedRoadmaps.map((roadmap) =>
        this.seedRoadmapProgressForPlacement(userId, roadmap, entryLevel),
      ),
    );
  }

  private async seedRoadmapProgressForPlacement(
    userId: Types.ObjectId,
    roadmap: RoadmapWithId,
    entryLevel: LessonLevel,
  ): Promise<void> {
    const nodes = await this.nodeModel
      .find({ roadmapId: roadmap._id })
      .sort({ milestoneOrder: 1, order: 1 });

    if (nodes.length === 0) return;

    const existingProgress = await this.progressModel.find({
      userId,
      roadmapId: roadmap._id,
    });
    const existingByNodeId = new Map(
      existingProgress.map((progress) => [progress.nodeId.toString(), progress]),
    );
    const hasMeaningfulProgress = existingProgress.some(
      (progress) =>
        progress.status !== NodeStatus.LOCKED &&
        progress.status !== NodeStatus.TEMP_LOCKED,
    );

    const startStageOrder = this.lessonLevelToStageOrder(entryLevel);
    const stageEntryIndex = startStageOrder * ROADMAP_STAGE_SIZE;
    const now = new Date();
    const operations: Parameters<typeof this.progressModel.bulkWrite>[0] = [];

    nodes.forEach((node, index) => {
      const nodeStageOrder = Math.floor(index / ROADMAP_STAGE_SIZE);
      const existing = existingByNodeId.get(node._id.toString());

      if (nodeStageOrder < startStageOrder) {
        if (existing?.status === NodeStatus.COMPLETED) return;

        operations.push({
          updateOne: {
            filter: {
              userId,
              nodeId: node._id,
            },
            update: {
              $set: {
                userId,
                nodeId: node._id,
                roadmapId: roadmap._id,
                status: NodeStatus.COMPLETED,
                score: Math.max(existing?.score ?? 0, 100),
                startedAt: existing?.startedAt ?? now,
                completedAt: existing?.completedAt ?? now,
                lastAttemptAt: existing?.lastAttemptAt ?? now,
              },
              $setOnInsert: {
                attemptCount: 0,
                submitCount: 0,
                wrongCount: 0,
                timeSpentSeconds: 0,
                bookmarked: false,
              },
            },
            upsert: true,
          },
        });
        return;
      }

      if (hasMeaningfulProgress) return;
      if (index !== stageEntryIndex) return;
      if (
        existing &&
        [
          NodeStatus.CURRENT,
          NodeStatus.OPEN,
          NodeStatus.COMPLETED,
          NodeStatus.SKIPPED,
        ].includes(existing.status)
      ) {
        return;
      }

      operations.push({
        updateOne: {
          filter: {
            userId,
            nodeId: node._id,
          },
          update: {
            $set: {
              userId,
              nodeId: node._id,
              roadmapId: roadmap._id,
              status: NodeStatus.CURRENT,
              startedAt: existing?.startedAt ?? now,
              lastAttemptAt: now,
            },
            $setOnInsert: {
              score: 0,
              attemptCount: 0,
              submitCount: 0,
              wrongCount: 0,
              timeSpentSeconds: 0,
              bookmarked: false,
            },
          },
          upsert: true,
        },
      });
    });

    if (operations.length > 0) {
      await this.progressModel.bulkWrite(operations);
    }
  }

  private lessonLevelToStageOrder(level: LessonLevel): number {
    if (level === LessonLevel.ADVANCED) return 2;
    if (level === LessonLevel.INTERMEDIATE) return 1;
    return 0;
  }
}
