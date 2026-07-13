import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Recall, RecallDocument } from './schemas/recall.schema';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * RecallService — chỉ phần "khởi tạo" của hệ SM-2 (xem ghi chú trong
 * recall.schema.ts). Mục đích hiện tại: đảm bảo mỗi node vừa hoàn thành có
 * 1 bản ghi Recall với nextReviewDate hợp lệ, để cron RECALL_DUE có dữ liệu
 * thật để quét.
 *
 * KHÔNG bao gồm việc cập nhật lại interval/easeFactor sau khi làm bài ôn
 * tập (bước "review" đầy đủ của SM-2) — đó là một tính năng Recall Test
 * riêng, ngoài phạm vi của việc bật notification.
 */
@Injectable()
export class RecallService {
    constructor(
        @InjectModel(Recall.name)
        private readonly recallModel: Model<RecallDocument>,
    ) { }

    /**
     * Tạo (hoặc bỏ qua nếu đã có) bản ghi recall ban đầu cho 1 node vừa hoàn
     * thành. interval = 1 ngày theo đúng bước đầu tiên của SM-2.
     */
    async scheduleInitialReview(
        userId: Types.ObjectId,
        nodeId: Types.ObjectId,
    ): Promise<RecallDocument | null> {
        const existing = await this.recallModel.findOne({ userId, nodeId });
        if (existing) return existing;

        return this.recallModel.create({
            userId,
            nodeId,
            interval: 1,
            easeFactor: 2.5,
            repetitions: 1,
            nextReviewDate: new Date(Date.now() + ONE_DAY_MS),
            lastReviewedAt: new Date(),
            lastQuality: 5,
            mode: 'auto',
        });
    }

    /** Danh sách các mục đến hạn ôn tập hôm nay trở về trước, cho 1 user. */
    async findDueForUser(userId: Types.ObjectId): Promise<RecallDocument[]> {
        return this.recallModel
            .find({ userId, nextReviewDate: { $lte: new Date() } })
            .exec();
    }

    /** Dùng bởi cron: tất cả user có ít nhất 1 mục đến hạn, kèm số lượng. */
    async findAllDueGroupedByUser(): Promise<{ userId: Types.ObjectId; count: number }[]> {
        const rows = await this.recallModel.aggregate<{
            _id: Types.ObjectId;
        count: number;
    }>([
        { $match: { nextReviewDate: { $lte: new Date() } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);
    return rows.map((r) => ({ userId: r._id, count: r.count }));
}
}