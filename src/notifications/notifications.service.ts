import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationType } from '../common/enums';
import { PaginatedResult, paginate } from '../common/dto/pagination.dto';
import {
    Notification,
    NotificationDocument,
} from './schemas/notification.schema';
import { NotificationsGateway } from './notifications.gateway';
import {
    CreateNotificationDto,
    GetNotificationsDto,
} from './dto/notifications.dto';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name)
        private readonly notificationModel: Model<NotificationDocument>,
        private readonly gateway: NotificationsGateway,
    ) { }

    /**
     * Tạo + gửi realtime 1 notification. Đây là entrypoint chính mà các
     * module khác (battles, penalties, learning-path, auth...) gọi tới.
     *
     * Luôn trả về document đã tạo — không throw ra ngoài nếu chỉ là lỗi
     * gateway/emit, để 1 lỗi socket không làm hỏng flow nghiệp vụ chính
     * của module gọi tới (giống pattern best-effort ở learning-path.service).
     */
    async create(dto: CreateNotificationDto): Promise<NotificationDocument> {
        const notification = await this.notificationModel.create({
            userId: new Types.ObjectId(dto.userId),
            type: dto.type,
            title: dto.title,
            body: dto.body,
            actionUrl: dto.actionUrl,
            data: dto.data ?? {},
            priority: dto.priority ?? 'normal',
            escalationLevel: dto.escalationLevel ?? 0,
            sent: true,
            sentAt: new Date(),
        });

        try {
            this.gateway.emitNew(dto.userId, notification);
            const unreadCount = await this.countUnread(dto.userId);
            this.gateway.emitUnreadCount(dto.userId, unreadCount);
        } catch {
            // Realtime là phụ — lỗi emit không được làm hỏng việc tạo notification.
        }

        return notification;
    }

    /** Tạo hàng loạt (vd cron streak/recall quét nhiều user 1 lượt). */
    async createMany(
        dtos: CreateNotificationDto[],
    ): Promise<NotificationDocument[]> {
        if (dtos.length === 0) return [];

        const docs = await this.notificationModel.insertMany(
            dtos.map((dto) => ({
                userId: new Types.ObjectId(dto.userId),
                type: dto.type,
                title: dto.title,
                body: dto.body,
                actionUrl: dto.actionUrl,
                data: dto.data ?? {},
                priority: dto.priority ?? 'normal',
                escalationLevel: dto.escalationLevel ?? 0,
                sent: true,
                sentAt: new Date(),
            })),
        );

        for (const doc of docs) {
            try {
                const userId = doc.userId.toString();
                this.gateway.emitNew(userId, doc);
                const unreadCount = await this.countUnread(userId);
                this.gateway.emitUnreadCount(userId, unreadCount);
            } catch {
                // best-effort, xem lý do ở create()
            }
        }

        return docs;
    }

    async findForUser(
        userId: string,
        query: GetNotificationsDto,
    ): Promise<PaginatedResult<NotificationDocument>> {
        const filter: Record<string, unknown> = {
            userId: new Types.ObjectId(userId),
        };
        if (query.type) filter.type = query.type;
        if (query.read !== undefined) filter.read = query.read;

        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        const [items, total] = await Promise.all([
            this.notificationModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(query.skip)
                .limit(limit)
                .exec(),
            this.notificationModel.countDocuments(filter),
        ]);

        return paginate(items, total, page, limit);
    }

    async countUnread(userId: string): Promise<number> {
        return this.notificationModel.countDocuments({
            userId: new Types.ObjectId(userId),
            read: false,
        });
    }

    /** Đánh dấu đã đọc 1 hoặc nhiều notification — chỉ của chính user đó. */
    async markRead(userId: string, ids: string[]): Promise<{ modified: number }> {
        const result = await this.notificationModel.updateMany(
            {
                _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
                userId: new Types.ObjectId(userId),
                read: false,
            },
            { $set: { read: true, readAt: new Date() } },
        );

        if (result.modifiedCount > 0) {
            try {
                const unreadCount = await this.countUnread(userId);
                this.gateway.emitUnreadCount(userId, unreadCount);
            } catch {
                // best-effort
            }
        }

        return { modified: result.modifiedCount };
    }

    async markAllRead(userId: string): Promise<{ modified: number }> {
        const result = await this.notificationModel.updateMany(
            { userId: new Types.ObjectId(userId), read: false },
            { $set: { read: true, readAt: new Date() } },
        );

        if (result.modifiedCount > 0) {
            try {
                this.gateway.emitUnreadCount(userId, 0);
            } catch {
                // best-effort
            }
        }

        return { modified: result.modifiedCount };
    }

    async remove(userId: string, id: string): Promise<void> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('ID không hợp lệ');
        }
        await this.notificationModel.deleteOne({
            _id: new Types.ObjectId(id),
            userId: new Types.ObjectId(userId),
        });
    }

    // ─────────────────────────────────────────────────────────────
    // Helper cho các module khác — mỗi hàm ứng với 1 NotificationType,
    // giữ nội dung tiếng Việt nhất quán ở một chỗ thay vì rải rác.
    // ─────────────────────────────────────────────────────────────

    async notifyBattleResult(params: {
        userId: string;
        battleId: string;
        won: boolean;
        isDraw: boolean;
        opponentScore: number;
        myScore: number;
    }) {
        const { userId, battleId, won, isDraw, opponentScore, myScore } = params;
        const title = isDraw
            ? 'Trận đấu hòa!'
            : won
                ? 'Chiến thắng! 🎉'
                : 'Đã kết thúc trận đấu';
        const body = isDraw
            ? `Trận đấu kết thúc với tỷ số hòa ${myScore} - ${opponentScore}.`
            : won
                ? `Bạn đã thắng với tỷ số ${myScore} - ${opponentScore}. Làm tốt lắm!`
                : `Bạn đã thua với tỷ số ${myScore} - ${opponentScore}. Thử lại nhé!`;

        return this.create({
            userId,
            type: NotificationType.BATTLE_RESULT,
            title,
            body,
            actionUrl: `/battles/${battleId}`,
            data: { battleId, won, isDraw, myScore, opponentScore },
            priority: 'normal',
        });
    }

    async notifyBattleInvite(params: {
        userId: string;
        battleId: string;
        inviterUsername: string;
    }) {
        return this.create({
            userId: params.userId,
            type: NotificationType.BATTLE_INVITE,
            title: 'Lời mời đấu trường',
            body: `${params.inviterUsername} đã mời bạn tham gia một trận đấu.`,
            actionUrl: `/battles/${params.battleId}`,
            data: { battleId: params.battleId },
            priority: 'high',
        });
    }

    async notifyPenaltyApplied(params: {
        userId: string;
        nodeId: string;
        lockUntil: Date;
    }) {
        return this.create({
            userId: params.userId,
            type: NotificationType.PENALTY_APPLIED,
            title: 'Bài học đã bị khóa',
            body: `Do có quá nhiều lần làm sai liên tiếp, bài học này đã bị khóa đến ${params.lockUntil.toLocaleString('vi-VN')}. Hoàn thành Recall Test để mở khóa sớm hơn.`,
            actionUrl: `/learning-path/nodes/${params.nodeId}`,
            data: { nodeId: params.nodeId, lockUntil: params.lockUntil },
            priority: 'high',
        });
    }

    async notifyLessonUnlock(params: {
        userId: string;
        nodeId: string;
        nodeTitle: string;
    }) {
        return this.create({
            userId: params.userId,
            type: NotificationType.LESSON_UNLOCK,
            title: 'Bài học mới đã mở khóa!',
            body: `Bạn đã hoàn thành xong và có thể tiếp tục với "${params.nodeTitle}".`,
            actionUrl: `/learning-path/nodes/${params.nodeId}`,
            data: { nodeId: params.nodeId },
            priority: 'normal',
        });
    }

    async notifyAchievement(params: {
        userId: string;
        badgeName: string;
        description?: string;
    }) {
        return this.create({
            userId: params.userId,
            type: NotificationType.ACHIEVEMENT,
            title: `Huy hiệu mới: ${params.badgeName} 🏆`,
            body:
                params.description ?? `Bạn vừa mở khóa huy hiệu "${params.badgeName}".`,
            actionUrl: '/profile?tab=badges',
            data: { badgeName: params.badgeName },
            priority: 'normal',
        });
    }

    async notifyRecallDue(params: {
        userId: string;
        questionId?: string;
        nodeId?: string;
        count: number;
    }) {
        const body =
            params.count > 1
                ? `Bạn có ${params.count} câu hỏi cần ôn tập lại hôm nay.`
                : 'Bạn có 1 câu hỏi cần ôn tập lại hôm nay.';

        return this.create({
            userId: params.userId,
            type: NotificationType.RECALL_DUE,
            title: 'Đến giờ ôn tập rồi!',
            body,
            actionUrl: '/recall',
            data: { questionId: params.questionId, nodeId: params.nodeId },
            priority: 'normal',
        });
    }

    async notifyStreakReminder(params: {
        userId: string;
        daysInactive: number;
        escalationLevel: 1 | 2 | 3;
    }) {
        const messages: Record<1 | 2 | 3, { title: string; body: string }> = {
            1: {
                title: 'Đừng quên chuỗi ngày học! 🔥',
                body: 'Hôm nay bạn chưa học gì cả. Học ngay để giữ streak nhé!',
            },
            2: {
                title: 'Chuỗi ngày học đang gặp nguy hiểm! ⚠️',
                body: `Đã ${params.daysInactive} ngày bạn chưa quay lại học. Streak của bạn sắp mất rồi!`,
            },
            3: {
                title: 'Đã lâu rồi bạn chưa quay lại 😢',
                body: `${params.daysInactive} ngày liên tiếp bạn chưa học. Quay lại ngay để không mất hết tiến độ!`,
            },
        };
        const { title, body } = messages[params.escalationLevel];

        return this.create({
            userId: params.userId,
            type: NotificationType.STREAK_REMINDER,
            title,
            body,
            actionUrl: '/learning-path',
            data: { daysInactive: params.daysInactive },
            priority: params.escalationLevel === 3 ? 'high' : 'normal',
            escalationLevel: params.escalationLevel,
        });
    }

    async notifyStreakBroken(params: { userId: string; previousStreak: number }) {
        return this.create({
            userId: params.userId,
            type: NotificationType.STREAK_BROKEN,
            title: 'Chuỗi ngày học đã bị ngắt 💔',
            body: `Chuỗi ${params.previousStreak} ngày liên tiếp của bạn đã kết thúc. Bắt đầu lại ngay hôm nay nhé!`,
            actionUrl: '/learning-path',
            data: { previousStreak: params.previousStreak },
            priority: 'normal',
        });
    }

    async notifySuspiciousLogin(params: { userId: string; ipAddress?: string }) {
        return this.create({
            userId: params.userId,
            type: NotificationType.SUSPICIOUS_LOGIN,
            title: 'Phát hiện đăng nhập bất thường',
            body: params.ipAddress
                ? `Tài khoản của bạn vừa bị khóa tạm thời do có nhiều lần đăng nhập sai liên tiếp từ IP ${params.ipAddress}. Nếu không phải bạn, hãy đổi mật khẩu ngay.`
                : 'Tài khoản của bạn vừa bị khóa tạm thời do có nhiều lần đăng nhập sai liên tiếp. Nếu không phải bạn, hãy đổi mật khẩu ngay.',
            actionUrl: '/settings/security',
            data: { ipAddress: params.ipAddress },
            priority: 'high',
        });
    }

    async notifyPracticeSolved(params: {
        userId: string;
        practiceId: string;
        practiceTitle: string;
        coinsEarned: number;
    }) {
        const { userId, practiceId, practiceTitle, coinsEarned } = params;
        const body =
            coinsEarned > 0
                ? `Bạn đã giải đúng "${practiceTitle}" và nhận được ${coinsEarned} coin. Làm tốt lắm!`
                : `Bạn đã giải đúng "${practiceTitle}".`;

        return this.create({
            userId,
            type: NotificationType.PRACTICE_SOLVED,
            title: 'Giải bài thành công! ✅',
            body,
            actionUrl: `/practice/${practiceId}`,
            data: { practiceId, coinsEarned },
            priority: 'normal',
        });
    }

    async notifyShopPurchase(params: {
        userId: string;
        purchaseId: string;
        itemNames: string[];
        totalCoins: number;
    }) {
        const { userId, purchaseId, itemNames, totalCoins } = params;
        const itemsLabel =
            itemNames.length > 1
                ? `${itemNames[0]} và ${itemNames.length - 1} vật phẩm khác`
                : itemNames[0];

        return this.create({
            userId,
            type: NotificationType.SHOP_PURCHASE,
            title: 'Mua hàng thành công! 🛍️',
            body: `Bạn đã mua ${itemsLabel} với giá ${totalCoins} coin.`,
            actionUrl: '/shop?tab=inventory',
            data: { purchaseId, itemNames, totalCoins },
            priority: 'normal',
        });
    }

    async notifySystem(params: {
        userId: string;
        title: string;
        body: string;
        actionUrl?: string;
    }) {
        return this.create({
            userId: params.userId,
            type: NotificationType.SYSTEM,
            title: params.title,
            body: params.body,
            actionUrl: params.actionUrl,
            priority: 'normal',
        });
    }
}