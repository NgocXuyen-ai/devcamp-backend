import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ErrorTracking,
  ErrorTrackingDocument,
} from './schema/error-tracking.schema';

@Injectable()
export class ErrorTrackingService {
  constructor(
    @InjectModel(ErrorTracking.name)
    private readonly errorTrackingModel: Model<ErrorTrackingDocument>,
  ) {}

  async getMyErrors(
    userId: string,
    type?: string,
    resolved?: string,
  ): Promise<ErrorTracking[]> {
    const filter: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };

    if (type) {
      filter['patterns.category'] = type;
    }

    if (resolved !== undefined) {
      filter.resolved = resolved === 'true';
    }

    return this.errorTrackingModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async getDiagnosticData(userId: string): Promise<any[]> {
    const errors = await this.errorTrackingModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('patterns')
      .exec();

    const statsMap = new Map<
      string,
      { count: number; totalSeverity: number }
    >();

    for (const err of errors) {
      if (err.patterns && Array.isArray(err.patterns)) {
        for (const pattern of err.patterns) {
          const current = statsMap.get(pattern.category) || {
            count: 0,
            totalSeverity: 0,
          };
          statsMap.set(pattern.category, {
            count: current.count + pattern.count,
            totalSeverity: current.totalSeverity + pattern.severity,
          });
        }
      }
    }

    return Array.from(statsMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      averageSeverity:
        data.count > 0
          ? Math.round((data.totalSeverity / data.count) * 10) / 10
          : 0,
    }));
  }

  async getErrorDetail(
    userId: string,
    errorId: string,
  ): Promise<ErrorTracking> {
    const errorLog = await this.errorTrackingModel
      .findOne({
        _id: new Types.ObjectId(errorId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (!errorLog) {
      throw new NotFoundException(
        'Không tìm thấy bản ghi lỗi này của người dùng!',
      );
    }
    return errorLog;
  }

  async resolveError(userId: string, errorId: string): Promise<ErrorTracking> {
    const updated = await this.errorTrackingModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(errorId),
          userId: new Types.ObjectId(userId),
        },
        {
          $set: {
            resolved: true,
            resolvedAt: new Date(),
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(
        'Cập nhật trạng thái sửa lỗi thất bại hoặc bản ghi không tồn tại!',
      );
    }
    return updated;
  }

  async countUnresolvedErrorsByNode(
    userId: string,
    nodeId: string,
  ): Promise<number> {
    return this.errorTrackingModel
      .countDocuments({
        userId: new Types.ObjectId(userId),
        nodeId: new Types.ObjectId(nodeId),
        resolved: false,
      })
      .exec();
  }
}
