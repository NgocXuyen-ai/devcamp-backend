import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  LearningHistory,
  LearningHistoryDocument,
} from './schemas/learning-history.schema';
import { Bookmark, BookmarkDocument } from './schemas/bookmark.schema';

@Injectable()
export class HistoryService {
  constructor(
    @InjectModel(LearningHistory.name)
    private readonly learningHistoryModel: Model<LearningHistoryDocument>,
    @InjectModel(Bookmark.name)
    private readonly bookmarkModel: Model<BookmarkDocument>,
  ) {}

  async getMyLearningHistory(
    userId: string,
    action?: string,
  ): Promise<LearningHistory[]> {
    const filter: Record<string, any> = { userId: new Types.ObjectId(userId) };

    if (action) {
      filter.action = action;
    }

    return this.learningHistoryModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
  }

  async getMyAnalytics(userId: string): Promise<Record<string, unknown>> {
    const records = await this.learningHistoryModel
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
