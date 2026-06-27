import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Penalty, PenaltyDocument } from './schemas/penalty.schema';
import { ErrorTrackingService } from '../error-tracking/error-tracking.service';

@Injectable()
export class PenaltiesService {
  constructor(
    @InjectModel(Penalty.name)
    private readonly penaltyModel: Model<PenaltyDocument>,
    private readonly errorTrackingService: ErrorTrackingService,
  ) {}

  async getMyActivePenalties(userId: string): Promise<Penalty[]> {
    return this.penaltyModel
      .find({ userId: new Types.ObjectId(userId), isLocked: true })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async checkNodePenaltyStatus(
    userId: string,
    nodeId: string,
  ): Promise<Record<string, unknown>> {
    const penalty = await this.penaltyModel
      .findOne({
        userId: new Types.ObjectId(userId),
        nodeId: new Types.ObjectId(nodeId),
      })
      .exec();

    const unresolvedErrorsCount =
      await this.errorTrackingService.countUnresolvedErrorsByNode(
        userId,
        nodeId,
      );

    const now = new Date();
    let isCooldownActive = false;
    let isLockActive = false;

    if (penalty) {
      if (penalty.cooldownUntil && penalty.cooldownUntil > now) {
        isCooldownActive = true;
      }

      if (penalty.isLocked || (penalty.lockUntil && penalty.lockUntil > now)) {
        isLockActive = true;
      }
    }

    return {
      isBlocked: isCooldownActive || isLockActive,
      isLocked: isLockActive,
      isCooldown: isCooldownActive,
      quotaRemaining: penalty ? penalty.quotaRemaining : 10,
      consecutiveFailures: penalty ? penalty.consecutiveFailures : 0,
      unresolvedErrorsCount,
      cooldownUntil: penalty?.cooldownUntil || null,
      lockUntil: penalty?.lockUntil || null,

      specialTestAvailable: unresolvedErrorsCount >= 5,
    };
  }

  async startRecallTest(
    userId: string,
    penaltyId: string,
  ): Promise<Record<string, unknown>> {
    const penalty = await this.penaltyModel
      .findOne({
        _id: new Types.ObjectId(penaltyId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (!penalty) {
      throw new NotFoundException('Không tìm thấy bản ghi hình phạt này!');
    }

    if (!penalty.isLocked) {
      return {
        success: false,
        message: 'Hình phạt này đang không ở trạng thái khóa.',
      };
    }

    const mockRecallTestId = new Types.ObjectId();

    penalty.activeRecallTestId = mockRecallTestId;
    await penalty.save();

    return {
      success: true,
      message:
        'Đã sinh thành công bài thi giải khóa Recall Test! Hãy hoàn thành để reset lại quota.',
      activeRecallTestId: mockRecallTestId,
    };
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

    return penalty.save();
  }

  async resetPenaltyAfterRecall(userId: string, nodeId: string): Promise<void> {
    await this.penaltyModel
      .updateOne(
        {
          userId: new Types.ObjectId(userId),
          nodeId: new Types.ObjectId(nodeId),
        },
        {
          $set: {
            quotaRemaining: 10,
            isLocked: false,
            consecutiveFailures: 0,
            cooldownUntil: null,
            lockUntil: null,
            activeRecallTestId: null,
          },
          $inc: { recallResetCount: 1 },
        },
      )
      .exec();
  }
}
