import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { SubmissionStatus } from '../../common/enums';
import {
  Submission,
  SubmissionDocument,
} from '../../exercises/schemas/submission.schema';
import { User, UserDocument } from '../../users/schemas/users.schema';
import { UsersService } from '../../users/service/users.service';
import {
  AnalyticsRangeDto,
  TopUsersQueryDto,
} from '../dto/analytics-query.dto';

const DAY_MS = 86_400_000;

export interface TimeBucket {
  bucket: string; // ISO datetime, start of bucket
  count: number;
}

@Injectable()
export class AdminAnalyticsService {
  constructor(
    private readonly users: UsersService,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
  ) {}

  // ----- helpers -----

  private resolveRange(range: AnalyticsRangeDto): { from: Date; to: Date } {
    const to = range.to ?? new Date();
    const from = range.from ?? new Date(to.getTime() - 30 * DAY_MS);
    return { from, to };
  }

  private dateTruncFormat(
    granularity: AnalyticsRangeDto['granularity'],
  ): string {
    switch (granularity) {
      case 'hour':
        return '%Y-%m-%dT%H:00:00Z';
      case 'week':
        return '%Y-%U';
      case 'month':
        return '%Y-%m';
      case 'day':
      default:
        return '%Y-%m-%d';
    }
  }

  // ===== USERS analytics =====

  /**
   * Overview card for the admin dashboard (top of page).
   * Returns total users, DAU/WAU/MAU, new signups in the period.
   */
  async usersOverview(range: AnalyticsRangeDto) {
    const { from, to } = this.resolveRange(range);
    const now = new Date();

    const [total, dau, wau, mau, newUsers] = await Promise.all([
      this.users.countAll(),
      this.users.countActiveSince(new Date(now.getTime() - DAY_MS)),
      this.users.countActiveSince(new Date(now.getTime() - 7 * DAY_MS)),
      this.users.countActiveSince(new Date(now.getTime() - 30 * DAY_MS)),
      this.users.countNewSince(from),
    ]);

    return {
      total,
      dau,
      wau,
      mau,
      newUsersInRange: newUsers,
      from,
      to,
    };
  }

  /** Signup curve over the requested range. */
  async signupTrend(range: AnalyticsRangeDto): Promise<TimeBucket[]> {
    const { from, to } = this.resolveRange(range);
    const format = this.dateTruncFormat(range.granularity);

    const pipeline: PipelineStage[] = [
      { $match: { createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, bucket: '$_id', count: 1 } },
    ];
    return this.userModel.aggregate<TimeBucket>(pipeline);
  }

  // ===== ERRORS / submissions analytics =====

  /**
   * Community-level error stats — drives the "Báo cáo lỗi cộng đồng" card.
   * (Reads from Submission failures since ErrorTracking module isn't built yet.)
   */
  async errorsOverview(range: AnalyticsRangeDto) {
    const { from, to } = this.resolveRange(range);

    const matchInRange: PipelineStage[] = [
      { $match: { createdAt: { $gte: from, $lte: to } } },
    ];

    const [totalEvents, accepted, failed] = await Promise.all([
      this.submissionModel.countDocuments({
        createdAt: { $gte: from, $lte: to },
      }),
      this.submissionModel.countDocuments({
        createdAt: { $gte: from, $lte: to },
        status: SubmissionStatus.ACCEPTED,
      }),
      this.submissionModel.countDocuments({
        createdAt: { $gte: from, $lte: to },
        status: { $ne: SubmissionStatus.ACCEPTED },
      }),
    ]);

    // Group failures by status to feed the breakdown chart.
    const byStatus = await this.submissionModel.aggregate<{
      status: SubmissionStatus;
      count: number;
    }>([
      ...matchInRange,
      { $match: { status: { $ne: SubmissionStatus.ACCEPTED } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);

    const uniqueUsersAffected = await this.submissionModel.distinct('userId', {
      createdAt: { $gte: from, $lte: to },
      status: { $ne: SubmissionStatus.ACCEPTED },
    });

    return {
      totalEvents,
      totalFailures: failed,
      totalAccepted: accepted,
      successRate: totalEvents ? accepted / totalEvents : 0,
      uniqueUsersAffected: uniqueUsersAffected.length,
      byStatus,
      from,
      to,
    };
  }

  /** Time-series of failures, used for the "Trend Analysis" chart. */
  async errorTrend(range: AnalyticsRangeDto): Promise<TimeBucket[]> {
    const { from, to } = this.resolveRange(range);
    const format = this.dateTruncFormat(range.granularity);

    const pipeline: PipelineStage[] = [
      {
        $match: {
          createdAt: { $gte: from, $lte: to },
          status: { $ne: SubmissionStatus.ACCEPTED },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, bucket: '$_id', count: 1 } },
    ];
    return this.submissionModel.aggregate<TimeBucket>(pipeline);
  }

  /**
   * "Active Anomalies" — heuristic alerts. We compare the last hour
   * against the same hour-window in the previous 24 hours; a 3x spike
   * is reported as an anomaly.
   */
  async activeAnomalies() {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const previous24 = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    const previous24End = new Date(now.getTime() - 60 * 60 * 1000);

    const [recent, baseline] = await Promise.all([
      this.submissionModel.countDocuments({
        createdAt: { $gte: lastHour, $lte: now },
        status: { $ne: SubmissionStatus.ACCEPTED },
      }),
      this.submissionModel.countDocuments({
        createdAt: { $gte: previous24, $lte: previous24End },
        status: { $ne: SubmissionStatus.ACCEPTED },
      }),
    ]);

    const baselineHourlyAverage = baseline / 24;
    const isSpike =
      baselineHourlyAverage > 1 && recent >= 3 * baselineHourlyAverage;

    const anomalies: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      message: string;
      metric: number;
    }> = [];

    if (isSpike) {
      anomalies.push({
        type: 'submission_failure_spike',
        severity: 'high',
        message: `Submission failures spiked: ${recent} in last hour vs ${baselineHourlyAverage.toFixed(1)} baseline`,
        metric: recent,
      });
    }
    return { anomalies, generatedAt: now };
  }

  /** Top users by submissions / failures — drives "Recent Users Affected". */
  async topAffectedUsers(q: TopUsersQueryDto) {
    const { from, to } = this.resolveRange(q);
    const limit = q.limit ?? 10;

    const pipeline: PipelineStage[] = [
      {
        $match: {
          createdAt: { $gte: from, $lte: to },
          status: { $ne: SubmissionStatus.ACCEPTED },
        },
      },
      {
        $group: {
          _id: '$userId',
          failures: { $sum: 1 },
          lastFailureAt: { $max: '$createdAt' },
        },
      },
      { $sort: { failures: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          username: '$user.username',
          email: '$user.email',
          avatarUrl: '$user.avatarUrl',
          failures: 1,
          lastFailureAt: 1,
        },
      },
    ];

    return this.submissionModel.aggregate(pipeline);
  }
}
