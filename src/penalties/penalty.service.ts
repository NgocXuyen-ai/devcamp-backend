import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Penalty, PenaltyDocument } from './schemas/penalty.schema';
import { ErrorTrackingService } from '../error-tracking/error-tracking.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PenaltiesService {
  constructor(
    @InjectModel(Penalty.name)
    private readonly penaltyModel: Model<PenaltyDocument>,
    private readonly errorTrackingService: ErrorTrackingService,
    private readonly notifications: NotificationsService,
  ) { }

  async getMyActivePenalties(userId: string): Promise<Penalty[]> {
    return this.penaltyModel
      .find({
        userId: new Types.ObjectId(userId),
        $or: [{ isLocked: true }, { cooldownUntil: { $gt: new Date() } }],
      })
      .exec();
  }

  async checkNodePenaltyStatus(
    userId: string,
    nodeId: string,
  ): Promise<{
    canSubmit: boolean;
    isLocked: boolean;
    cooldownUntil?: Date;
    lockUntil?: Date;
    quotaRemaining: number;
  }> {
    const penalty = await this.penaltyModel
      .findOne({
        userId: new Types.ObjectId(userId),
        nodeId: new Types.ObjectId(nodeId),
      })
      .exec();

    if (!penalty) {
      return { canSubmit: true, isLocked: false, quotaRemaining: 10 };
    }

    const now = new Date();

    if (penalty.isLocked && penalty.lockUntil && penalty.lockUntil > now) {
      return {
        canSubmit: false,
        isLocked: true,
        lockUntil: penalty.lockUntil,
        quotaRemaining: penalty.quotaRemaining,
      };
    }

    if (penalty.cooldownUntil && penalty.cooldownUntil > now) {
      return {
        canSubmit: false,
        isLocked: false,
        cooldownUntil: penalty.cooldownUntil,
        quotaRemaining: penalty.quotaRemaining,
      };
    }

    return {
      canSubmit: true,
      isLocked: false,
      quotaRemaining: penalty.quotaRemaining,
    };
  }

  async startRecallTest(
    userId: string,
    nodeId: string,
  ): Promise<{ testId: string }> {
    const penalty = await this.penaltyModel
      .findOne({
        userId: new Types.ObjectId(userId),
        nodeId: new Types.ObjectId(nodeId),
      })
      .exec();

    if (!penalty) {
      throw new NotFoundException('Không tìm thấy penalty cho node này');
    }

    return { testId: penalty._id.toString() };
  }

  async handleUpdatePenaltyOnFailure(
    userId: string,
    nodeId: string,
  ): Promise<Penalty> {
    let penalty = await this.penaltyModel
      .findOne({
        userId: new Types.ObjectId(userId),
        nodeId: new Types.ObjectId(nodeId),
      })
      .exec();

    if (!penalty) {
      penalty = new this.penaltyModel({
        userId: new Types.ObjectId(userId),
        nodeId: new Types.ObjectId(nodeId),
        type: 'LIGHT',
        quotaRemaining: 10,
        quotaMax: 10,
        consecutiveFailures: 0,
      });
    }

    const wasLocked = penalty.isLocked;

    penalty.consecutiveFailures += 1;
    if (penalty.quotaRemaining > 0) {
      penalty.quotaRemaining -= 1;
    }

    const now = new Date();

    if (penalty.consecutiveFailures >= 4 && penalty.consecutiveFailures <= 9) {
      penalty.cooldownUntil = new Date(now.getTime() + 30 * 1000);
    } else if (penalty.consecutiveFailures >= 10) {
      penalty.isLocked = true;
      penalty.lockUntil = new Date(now.getTime() + 30 * 60 * 1000);
    }

    const saved = await penalty.save();

    // Chỉ báo đúng lúc chuyển pha "chưa khóa → vừa khóa", tránh spam
    // notification nếu user (hoặc client cũ) vẫn tiếp tục gửi request sai
    // sau khi đã bị khóa.
    if (!wasLocked && saved.isLocked && saved.lockUntil) {
      this.notifications
        .notifyPenaltyApplied({
          userId,
          nodeId,
          lockUntil: saved.lockUntil,
        })
        .catch(() => undefined);
    }

    return saved;
  }

  async resetPenaltyAfterRecall(userId: string, nodeId: string): Promise<void> {
    await this.penaltyModel.updateOne(
      {
        userId: new Types.ObjectId(userId),
        nodeId: new Types.ObjectId(nodeId),
      },
      {
        $set: {
          isLocked: false,
          consecutiveFailures: 0,
        },
        $unset: { lockUntil: '', cooldownUntil: '' },
      },
    );
  }
}