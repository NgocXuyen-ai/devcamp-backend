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
import { NotificationsService } from '../notifications/notifications.service';
import { RecallService } from '../recall/recall.service';
import {
  buildBackendRoadmapSeed,
  buildFrontendRoadmapSeed,
} from './learning-path.seed';

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

    private readonly notifications: NotificationsService,
    private readonly recall: RecallService,
  ) {}

  // =========================
  // SEED
  // =========================

  /**
   * Đảm bảo luôn tồn tại Roadmap "Frontend Roadmap" và "Backend Roadmap"
   * (mỗi cái kèm đủ 30 RoadmapNode) trước khi trả dữ liệu ra ngoài.
   *
   * Vì sao cần: FE (`LearningPathMap.tsx`) chỉ hiển thị dữ liệu THẬT (cho
   * phép progress/unlock hoạt động) khi `GET /learning-paths` trả về ít
   * nhất 1 roadmap khớp field đang xem — nếu rỗng, FE tự fallback sang một
   * mảng tĩnh hard-code trong RoadmapViewer.tsx chỉ để hiển thị, không hề
   * gọi lại backend nữa, nên node "kế tiếp" sẽ không bao giờ được mở khóa
   * dù người dùng đã nộp bài thành công.
   *
   * Theo đúng pattern `ensureSeeded()` đã dùng ở GuildsService: kiểm tra
   * rỗng trước khi insert, nên gọi lại nhiều lần vẫn an toàn (idempotent),
   * và không cần người dùng tự chạy script CLI riêng.
   */
  private async ensureSeeded(): Promise<void> {
    const count = await this.roadmapModel.countDocuments({
      field: { $in: [CareerField.FRONTEND, CareerField.BACKEND] },
    });
    if (count > 0) return;

    const seeds = [buildFrontendRoadmapSeed(), buildBackendRoadmapSeed()];
    for (const { roadmap, nodes } of seeds) {
      await this.roadmapModel.create(roadmap);
      await this.nodeModel.insertMany(nodes);
    }
  }

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
    await this.ensureSeeded();
    return this.roadmapModel.find();
  }

  async findPathById(pathId: string) {
    await this.ensureSeeded();
    if (!Types.ObjectId.isValid(pathId)) {
      throw new NotFoundException('Roadmap not found');
    }
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
    if (!Types.ObjectId.isValid(nodeId)) {
      throw new NotFoundException('Node not found');
    }
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

    // Lấy trạng thái cũ trước khi update, để chỉ báo LESSON_UNLOCK đúng
    // lần đầu chuyển sang completed — tránh spam nếu user nộp lại bài
    // của 1 node đã xong từ trước.
    const previous = await this.progressModel
      .findOne({ userId, nodeId: new Types.ObjectId(nodeId) })
      .lean();
    const wasCompleted = previous?.status === NodeStatus.COMPLETED;

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

    // Mở khóa node kế tiếp trong roadmap + khởi tạo lịch ôn tập SM-2,
    // đúng lần đầu hoàn thành node này (tránh mở lại/spam khi nộp lại
    // bài của 1 node đã xong từ trước).
    if (isCompleted && !wasCompleted) {
      const nextNode = await this.unlockNextNode(userId, node);

      // Báo "bài học mới mở khóa" — trỏ vào node VỪA được mở (nextNode),
      // không phải node vừa hoàn thành, để nội dung thông báo đúng nghĩa
      // "bạn có thể tiếp tục với X". Nếu đây là node cuối roadmap thì
      // không có nextNode → không bắn thông báo unlock.
      if (nextNode) {
        this.notifications
          .notifyLessonUnlock({
            userId: userId.toString(),
            nodeId: nextNode._id.toString(),
            nodeTitle: nextNode.title,
          })
          .catch(() => undefined);
      }

      this.recall
        .scheduleInitialReview(userId, new Types.ObjectId(nodeId))
        .catch(() => undefined);
    }

    return progress;
  }

  /**
   * Tìm node kế tiếp ngay sau `completedNode` trong cùng roadmap (theo thứ
   * tự milestoneOrder → order, đúng thứ tự getNodes() trả về), rồi mở khóa
   * nó cho user bằng cách upsert UserProgress = CURRENT.
   *
   * Không đụng tới node kế tiếp nếu nó đã COMPLETED/SKIPPED từ trước (user
   * có thể đã học vượt lên hoặc được pre-unlock qua survey placement) —
   * chỉ nâng cấp khi đang LOCKED/TEMP_LOCKED hoặc chưa có progress record.
   *
   * Trả về node vừa mở khóa (hoặc undefined nếu completedNode là node
   * cuối cùng của roadmap, hoặc node kế tiếp không cần mở khóa lại).
   */
  private async unlockNextNode(
    userId: Types.ObjectId,
    completedNode: RoadmapNode & { _id: Types.ObjectId },
  ) {
    const nextNode = await this.nodeModel
      .findOne({
        roadmapId: completedNode.roadmapId,
        $or: [
          {
            milestoneOrder: completedNode.milestoneOrder,
            order: { $gt: completedNode.order },
          },
          { milestoneOrder: { $gt: completedNode.milestoneOrder } },
        ],
      })
      .sort({ milestoneOrder: 1, order: 1 });

    if (!nextNode) return undefined; // completedNode là node cuối roadmap

    const existing = await this.progressModel
      .findOne({ userId, nodeId: nextNode._id })
      .lean();

    // Đã completed/skipped/current từ trước (vượt tiến độ, pre-unlock qua
    // survey, hoặc đã mở sẵn) → không hạ cấp, không cần báo lại.
    if (
      existing &&
      [
        NodeStatus.COMPLETED,
        NodeStatus.SKIPPED,
        NodeStatus.CURRENT,
        NodeStatus.OPEN,
      ].includes(existing.status)
    ) {
      return undefined;
    }

    const now = new Date();
    await this.progressModel.updateOne(
      { userId, nodeId: nextNode._id },
      {
        $set: {
          userId,
          nodeId: nextNode._id,
          roadmapId: nextNode.roadmapId,
          status: NodeStatus.CURRENT,
          lastAttemptAt: now,
          ...(existing?.startedAt ? {} : { startedAt: now }),
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
      { upsert: true },
    );

    return nextNode;
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
        selectedRoadmaps.push(roadmap);
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
      existingProgress.map((progress) => [
        progress.nodeId.toString(),
        progress,
      ]),
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
      const isSurveySeededCompletion =
        existing?.status === NodeStatus.COMPLETED &&
        (existing.submitCount ?? 0) === 0 &&
        (existing.attemptCount ?? 0) === 0 &&
        (existing.score ?? 0) >= 100;

      if (nodeStageOrder < startStageOrder) {
        if (
          existing?.status === NodeStatus.COMPLETED &&
          !isSurveySeededCompletion
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
                status: NodeStatus.OPEN,
                score: isSurveySeededCompletion ? 0 : (existing?.score ?? 0),
                startedAt: existing?.startedAt ?? now,
              },
              $unset: { completedAt: 1 },
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
