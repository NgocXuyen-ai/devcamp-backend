import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/users.schema';

export function computeLevelFromXp(xp: number): number {
  if (xp <= 0) return 1;
  let level = 1;
  while (100 * Math.pow(level, 1.5) <= xp) level++;
  return level;
}

@Injectable()
export class GamificationService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async addXp(userId: Types.ObjectId, amount: number): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.gamification.xp += Math.max(0, amount);
    user.gamification.level = computeLevelFromXp(user.gamification.xp);
    await user.save();
    return user;
  }

  async addCoins(userId: Types.ObjectId, amount: number): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $inc: { 'gamification.coins': amount } },
    );
  }

  async unlockBadge(userId: Types.ObjectId, badge: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId, 'gamification.badges': { $ne: badge } },
      { $push: { 'gamification.badges': badge } },
    );
  }

  async touchStreak(userId: Types.ObjectId): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last = user.gamification.lastActiveDate
      ? new Date(user.gamification.lastActiveDate)
      : null;
    if (last) last.setHours(0, 0, 0, 0);

    if (!last) {
      user.gamification.currentStreak = 1;
    } else {
      const diffDays = Math.floor(
        (today.getTime() - last.getTime()) / 86_400_000,
      );
      if (diffDays === 0) {
        // already counted today
      } else if (diffDays === 1) {
        user.gamification.currentStreak += 1;
      } else {
        user.gamification.currentStreak = 1;
      }
    }
    user.gamification.longestStreak = Math.max(
      user.gamification.longestStreak,
      user.gamification.currentStreak,
    );
    user.gamification.lastActiveDate = today;
    await user.save();
    return user;
  }

  async breakStreak(userId: Types.ObjectId): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { 'gamification.currentStreak': 0 } },
    );
  }
}
