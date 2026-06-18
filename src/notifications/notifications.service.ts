import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { Notification } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  getMyNotifications(userId: Types.ObjectId, query: GetNotificationsQueryDto) {
    const filter: Record<string, unknown> = { userId };

    if (query.read !== undefined) {
      filter.read = query.read === 'true';
    }

    if (query.type) {
      filter.type = query.type;
    }

    return this.notificationModel.find(filter).sort({ createdAt: -1 });
  }

  async markOneAsRead(userId: Types.ObjectId, notificationId: string) {
    const notification = await this.notificationModel.findOneAndUpdate(
      {
        _id: notificationId,
        userId,
      },
      {
        read: true,
        readAt: new Date(),
      },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAllAsRead(userId: Types.ObjectId) {
    const result = await this.notificationModel.updateMany(
      {
        userId,
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      },
    );

    return {
      modifiedCount: result.modifiedCount,
    };
  }

  async deleteNotification(userId: Types.ObjectId, notificationId: string) {
    const result = await this.notificationModel.deleteOne({
      _id: notificationId,
      userId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Notification not found');
    }

    return {
      deleted: true,
    };
  }
}
