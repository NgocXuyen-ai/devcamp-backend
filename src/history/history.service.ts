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

export type ErrorItem = {
  id: string;
  icon: string;
  title: string;
  context: string;
};

export type AdviceData = {
  weakness: string;
  suggestedTitle: string;
  suggestedNodeId: string | null;
};

export type TrackingResponse = {
  totalActive: number;
  errorChronology: ErrorItem[];
  advice: AdviceData | null;
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

  async removeDraft(
    userId: Types.ObjectId,
    draftId: string,
  ): Promise<{ success: boolean }> {
    if (!Types.ObjectId.isValid(draftId)) {
      throw new BadRequestException('Invalid draft id');
    }
    // "Draft" ở tab Unfinished là một battle chưa kết thúc của user → huỷ nó.
    await this.battleModel.updateOne(
      { _id: new Types.ObjectId(draftId), 'players.userId': userId },
      { status: BattleStatus.CANCELLED },
    );
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

  async getTracking(userId: Types.ObjectId): Promise<TrackingResponse> {
    // "Anomalies" = các node đang làm dở mà user gặp lỗi (wrongCount > 0) hoặc bị tạm khoá.
    const rows = await this.progressModel
      .find({
        userId,
        status: {
          $in: [NodeStatus.CURRENT, NodeStatus.OPEN, NodeStatus.TEMP_LOCKED],
        },
      })
      .sort({ wrongCount: -1, lastAttemptAt: -1, updatedAt: -1 })
      .limit(50)
      .populate('nodeId')
      .lean<PopulatedProgress[]>();

    const anomalies = rows.filter(
      (row) =>
        (row.wrongCount ?? 0) > 0 || row.status === NodeStatus.TEMP_LOCKED,
    );

    const errorChronology: ErrorItem[] = anomalies.map((row) => {
      const node = row.nodeId;
      const wrong = row.wrongCount ?? 0;
      const context =
        row.status === NodeStatus.TEMP_LOCKED
          ? 'Temporarily locked after too many wrong submissions'
          : (node?.description?.slice(0, 80) ??
            node?.tags?.[0] ??
            `${wrong} wrong attempt${wrong === 1 ? '' : 's'}`);
      return {
        id: String(row._id),
        icon: row.status === NodeStatus.TEMP_LOCKED ? 'lock' : 'bug_report',
        title: node?.title ?? 'Untitled Quest',
        context,
      };
    });

    const worst = anomalies[0];
    const advice: AdviceData | null = worst
      ? {
          weakness:
            worst.nodeId?.tags?.[0] ??
            worst.nodeId?.title ??
            'Repeated mistakes on an active quest',
          suggestedTitle: worst.nodeId?.title ?? 'Review your current quest',
          suggestedNodeId: worst.nodeId?._id ? String(worst.nodeId._id) : null,
        }
      : null;

    return {
      totalActive: errorChronology.length,
      errorChronology,
      advice,
    };
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
}
