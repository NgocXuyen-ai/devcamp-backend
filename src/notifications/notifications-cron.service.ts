import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from '../users/service/users.service';
import { GamificationService } from '../users/service/gamification.service';
import { RecallService } from './../recall/recall.service';
import { NotificationsService } from './notifications.service';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Cron job cho các notification "chủ động" — không gắn với 1 action cụ thể
 * của user (khác với battle/penalty/lesson unlock, vốn bắn ngay lúc xảy ra
 * sự kiện). Chạy mỗi ngày 1 lần lúc 08:00 giờ server.
 *
 * Đặt ở module riêng (không phải bên trong NotificationsModule) để tránh
 * circular dependency: NotificationsModule được nhiều module thấp hơn
 * (auth, battles, penalties, exercises...) import, nên bản thân nó không
 * được phép phụ thuộc ngược lại UsersModule/RecallModule.
 */
@Injectable()
export class NotificationsCronService {
    private readonly logger = new Logger(NotificationsCronService.name);

    constructor(
        private readonly users: UsersService,
        private readonly gamification: GamificationService,
        private readonly recall: RecallService,
        private readonly notifications: NotificationsService,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_8AM)
    async runDailyChecks() {
        await Promise.all([
            this.checkStreakReminders().catch((err: unknown) =>
                this.logger.error('checkStreakReminders failed', err),
            ),
            this.checkRecallDue().catch((err: unknown) =>
                this.logger.error('checkRecallDue failed', err),
            ),
        ]);
    }

    /**
     * Escalation theo ghi chú trong notification.schema.ts:
     *   ngày 1 (chưa học hôm nay) → nhẹ
     *   ngày 3 → vừa
     *   ngày 7 → mạnh
     * "Ngày" ở đây tính từ gamification.lastActiveDate.
     */
    private async checkStreakReminders() {
        const threshold = new Date(Date.now() - ONE_DAY_MS); // >= 1 ngày chưa học
        // findInactiveLearners() đã lọc sẵn currentStreak > 0 ở tầng query.
        const inactive = await this.users.findInactiveLearners(threshold);

        for (const learner of inactive) {
            if (!learner.lastActiveDate) continue;

            const daysInactive = Math.floor(
                (Date.now() - learner.lastActiveDate.getTime()) / ONE_DAY_MS,
            );

            // Giữ nguyên bậc thang cảnh báo gốc: ngày 1/3/7 vẫn nhắc tăng dần
            // (streak coi như "đang treo", chưa mất hẳn — cho user cơ hội cứu).
            // Chỉ khi đã qua mốc cảnh báo mạnh nhất (ngày 7) mà vẫn không quay
            // lại thì streak mới thực sự bị coi là chết — bắn streak_broken
            // đúng 1 lần ở ngày 8, rồi reset field currentStreak về 0 (trước
            // đó breakStreak() chưa từng được gọi ở bất kỳ đâu trong codebase,
            // nên field này bị "mồ côi" — không tự về 0 cho tới khi user quay
            // lại và touchStreak() âm thầm ghi đè nó, không kèm thông báo nào).
            if (daysInactive === 8) {
                const previousStreak = learner.currentStreak;
                await this.gamification
                    .breakStreak(learner.userId)
                    .then(() =>
                        this.notifications.notifyStreakBroken({
                            userId: learner.userId.toString(),
                            previousStreak,
                        }),
                    )
                    .catch((err: unknown) =>
                        this.logger.error(
                            `breakStreak/notifyStreakBroken failed for user ${learner.userId.toString()}`,
                            err,
                        ),
                    );
                continue;
            }

            const escalationLevel = this.escalationLevelFor(daysInactive);
            if (!escalationLevel) continue;

            await this.notifications
                .notifyStreakReminder({
                    userId: learner.userId.toString(),
                    daysInactive,
                    escalationLevel,
                })
                .catch(() => undefined);
        }
    }

    /** Chỉ nhắc đúng vào các mốc 1/3/7 ngày — tránh spam mỗi ngày một lần. */
    private escalationLevelFor(daysInactive: number): 1 | 2 | 3 | null {
        if (daysInactive === 1) return 1;
        if (daysInactive === 3) return 2;
        if (daysInactive === 7) return 3;
        return null;
    }

    private async checkRecallDue() {
        const dueGroups = await this.recall.findAllDueGroupedByUser();

        for (const group of dueGroups) {
            await this.notifications
                .notifyRecallDue({
                    userId: group.userId.toString(),
                    count: group.count,
                })
                .catch(() => undefined);
        }
    }
}