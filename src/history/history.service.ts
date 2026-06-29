import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { LearningHistory } from './schemas/learning-history.schema';
import { Bookmark } from './schemas/bookmark.schema';
import { UserProgress } from '../learning-path/schemas/user-progress.schema';
import { RoadmapNode } from '../learning-path/schemas/roadmap-node.schema';
import { Battle } from '../battles/schemas/battle.schema';
import {
  BattleMode,
  BattleStatus,
  HistoryAction,
  NodeStatus,
  NodeType,
} from '../common/enums';

export type FinishedLesson = {
  id: string;
  title: string;
  status: 'MASTERED' | 'IN_PROGRESS' | 'SAVED';
  completedAt: string;
  score: number;
  icon: string;
};

export type UnfinishedQuest = {
  id: string;
  title: string;
  stepLabel: string;
  currentStep: number;
  totalSteps: number;
  progress: number;
  icon: string;
};

export type BattleDraft = {
  id: string;
  title: string;
  description: string;
  intensity: 'HIGH' | 'MEDIUM' | 'LOW';
  timeAgo: string;
};

export type UnfinishedResponse = {
  quests: UnfinishedQuest[];
  drafts: BattleDraft[];
};

export type SavedLore = {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  tags: string[];
  isBookmarked: boolean;
};

export type ActivityEntry = {
  id: string;
  action: HistoryAction;
  score?: number;
  xpEarned?: number;
  coinsEarned?: number;
  createdAt: string;
  metadata: Record<string, unknown>;
};

type LeanNode = RoadmapNode & { _id: Types.ObjectId };

type PopulatedProgress = Omit<UserProgress, 'nodeId'> & {
  _id: Types.ObjectId;
  nodeId?: LeanNode | null;
  completedAt?: Date;
  updatedAt?: Date;
  lastAttemptAt?: Date;
};

type PopulatedBookmark = Omit<Bookmark, 'nodeId'> & {
  _id: Types.ObjectId;
  nodeId?: LeanNode | null;
  createdAt?: Date;
};

type LeanBattle = Battle & { _id: Types.ObjectId; createdAt?: Date };

type LeanHistory = LearningHistory & { _id: Types.ObjectId; createdAt?: Date };

@Injectable()
export class HistoryService {
  constructor(
    @InjectModel(LearningHistory.name)
    private readonly historyModel: Model<LearningHistory>,

    @InjectModel(Bookmark.name)
    private readonly bookmarkModel: Model<Bookmark>,

    @InjectModel(UserProgress.name)
    private readonly progressModel: Model<UserProgress>,

    @InjectModel(Battle.name)
    private readonly battleModel: Model<Battle>,
  ) {}

  async getFinished(userId: Types.ObjectId): Promise<FinishedLesson[]> {
    const rows = await this.progressModel
      .find({ userId, status: NodeStatus.COMPLETED })
      .sort({ completedAt: -1, updatedAt: -1 })
      .limit(50)
      .populate('nodeId')
      .lean<PopulatedProgress[]>();

    return rows.map((row) => ({
      id: String(row._id),
      title: row.nodeId?.title ?? 'Untitled Lesson',
      status: 'MASTERED',
      completedAt: this.formatDate(row.completedAt ?? row.updatedAt),
      score: Math.round(row.score ?? 0),
      icon: this.nodeIcon(row.nodeId?.type),
    }));
  }

  async getUnfinished(userId: Types.ObjectId): Promise<UnfinishedResponse> {
    const [progressRows, battles] = await Promise.all([
      this.progressModel
        .find({
          userId,
          status: { $in: [NodeStatus.CURRENT, NodeStatus.OPEN] },
        })
        .sort({ lastAttemptAt: -1, updatedAt: -1 })
        .limit(50)
        .populate('nodeId')
        .lean<PopulatedProgress[]>(),
      this.battleModel
        .find({
          'players.userId': userId,
          status: {
            $in: [
              BattleStatus.WAITING,
              BattleStatus.MATCHED,
              BattleStatus.IN_PROGRESS,
            ],
          },
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean<LeanBattle[]>(),
    ]);

    const quests: UnfinishedQuest[] = progressRows.map((row) => {
      const node = row.nodeId;
      const totalSteps = Math.max(node?.content?.questionIds?.length ?? 0, 1);
      const currentStep = Math.min(row.submitCount ?? 0, totalSteps);
      const score = Math.round(row.score ?? 0);
      const progress =
        score > 0 ? score : Math.round((currentStep / totalSteps) * 100);

      return {
        id: String(row._id),
        title: node?.title ?? 'Untitled Quest',
        stepLabel:
          node?.description?.slice(0, 80) ?? node?.tags?.[0] ?? 'In progress',
        currentStep,
        totalSteps,
        progress,
        icon: this.nodeIcon(node?.type),
      };
    });

    const drafts: BattleDraft[] = battles.map((battle) => ({
      id: String(battle._id),
      title: this.battleTitle(battle),
      description:
        battle.mode === BattleMode.PERFORMANCE
          ? 'Performance duel awaiting your return — algorithm-heavy challenge.'
          : 'Speed duel awaiting your return — race against the clock.',
      intensity: battle.mode === BattleMode.PERFORMANCE ? 'HIGH' : 'MEDIUM',
      timeAgo: this.timeAgo(battle.createdAt),
    }));

    return { quests, drafts };
  }

  async getBookmarks(userId: Types.ObjectId): Promise<SavedLore[]> {
    const rows = await this.bookmarkModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('nodeId')
      .lean<PopulatedBookmark[]>();

    return rows.map((row) => {
      const node = row.nodeId;
      const tags = [...(node?.tags ?? []), ...(row.tags ?? [])].slice(0, 3);
      return {
        id: String(row._id),
        title: node?.title ?? 'Saved Item',
        description: row.note ?? node?.description ?? 'Saved for later review.',
        bannerUrl: node?.thumbnailUrl ?? this.fallbackBanner(String(row._id)),
        tags: tags.length ? tags : ['Saved'],
        isBookmarked: true,
      };
    });
  }

  async removeBookmark(
    userId: Types.ObjectId,
    bookmarkId: string,
  ): Promise<{ success: boolean }> {
    if (!Types.ObjectId.isValid(bookmarkId)) {
      throw new BadRequestException('Invalid bookmark id');
    }
    const id = new Types.ObjectId(bookmarkId);

    const res = await this.bookmarkModel.deleteOne({ _id: id, userId });
    if (res.deletedCount === 0) {
      // Fallback: maybe it was a UserProgress-level bookmark flag instead.
      await this.progressModel.updateOne(
        { _id: id, userId },
        { bookmarked: false },
      );
    }
    return { success: true };
  }

  async getActivity(userId: Types.ObjectId): Promise<ActivityEntry[]> {
    const rows = await this.historyModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean<LeanHistory[]>();

    return rows.map((row) => ({
      id: String(row._id),
      action: row.action,
      score: row.score,
      xpEarned: row.xpEarned,
      coinsEarned: row.coinsEarned,
      createdAt: row.createdAt?.toISOString() ?? '',
      metadata: row.metadata ?? {},
    }));
  }

  private nodeIcon(type?: NodeType): string {
    switch (type) {
      case NodeType.ASSIGNMENT:
        return '📝';
      case NodeType.LAB:
        return '🧪';
      case NodeType.MINI_PROJECT:
        return '🛠';
      case NodeType.QUIZ:
        return '❓';
      case NodeType.MILESTONE_GATE:
        return '🏰';
      case NodeType.LESSON:
      default:
        return '📘';
    }
  }

  private battleTitle(battle: LeanBattle): string {
    const mode =
      battle.mode === BattleMode.PERFORMANCE ? 'Performance' : 'Speed';
    const field = battle.field
      ? battle.field.charAt(0).toUpperCase() + battle.field.slice(1)
      : 'Arena';
    return `${mode} Duel — ${field}`;
  }

  private fallbackBanner(seed: string): string {
    return `https://picsum.photos/seed/${seed}/400/250`;
  }

  private formatDate(date?: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private timeAgo(date?: Date): string {
    if (!date) return 'recently';
    const diffMs = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  }

  async getMyLearningHistory(
    userId: string,
    action?: string,
  ): Promise<LearningHistory[]> {
    const filter: Record<string, any> = { userId: new Types.ObjectId(userId) };

    if (action) {
      filter.action = action;
    }

    return this.historyModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async getMyAnalytics(userId: string): Promise<Record<string, unknown>> {
    const records = await this.historyModel
      .find({ userId: new Types.ObjectId(userId) })
      .exec();

    let totalXp = 0;
    let totalCoins = 0;

    records.forEach((rec) => {
      if (rec.xpEarned) totalXp += rec.xpEarned;
      if (rec.coinsEarned) totalCoins += rec.coinsEarned;
    });

    return {
      totalActivities: records.length,
      totalXpEarned: totalXp,
      totalCoinsEarned: totalCoins,
    };
  }

  async getMyBookmarks(userId: string): Promise<Bookmark[]> {
    return this.bookmarkModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async toggleBookmark(
    userId: string,
    payload: {
      nodeId?: string;
      questionId?: string;
      exerciseId?: string;
      note?: string;
      tags?: string[];
    },
  ): Promise<Record<string, unknown>> {
    const filter: Record<string, any> = { userId: new Types.ObjectId(userId) };

    if (payload.nodeId) filter.nodeId = new Types.ObjectId(payload.nodeId);
    if (payload.questionId)
      filter.questionId = new Types.ObjectId(payload.questionId);
    if (payload.exerciseId)
      filter.exerciseId = new Types.ObjectId(payload.exerciseId);

    const existing = await this.bookmarkModel.findOne(filter).exec();

    if (existing) {
      await this.bookmarkModel.deleteOne({ _id: existing._id }).exec();
      return { bookmarked: false, message: 'Đã bỏ lưu mục này thành công.' };
    }

    const newBookmark = new this.bookmarkModel({
      userId: new Types.ObjectId(userId),
      nodeId: payload.nodeId ? new Types.ObjectId(payload.nodeId) : undefined,
      questionId: payload.questionId
        ? new Types.ObjectId(payload.questionId)
        : undefined,
      exerciseId: payload.exerciseId
        ? new Types.ObjectId(payload.exerciseId)
        : undefined,
      note: payload.note,
      tags: payload.tags || [],
    });

    await newBookmark.save();
    return {
      bookmarked: true,
      message: 'Đã lưu mục này thành công vào Tab đánh dấu!',
    };
  }
}
