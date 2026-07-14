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

/**
 * XP tối thiểu cần để ĐẠT một level cho trước.
 *
 * Khớp chính xác với vòng lặp trong computeLevelFromXp(): level tăng lên L
 * khi `100 * (L-1)^1.5 <= xp` (vòng while kiểm tra level TRƯỚC khi tăng),
 * nên ngưỡng sàn của level L là (L-1), không phải L. Dùng level thay vì
 * level+1 ở đây sẽ làm lệch 1 level so với computeLevelFromXp — đã verify
 * bằng exhaustive test trên toàn bộ xp = 0..200000.
 */
export function xpThresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.ceil(100 * Math.pow(level - 1, 1.5));
}

export interface XpProgress {
  /** Level hiện tại, suy ra trực tiếp từ xp — luôn khớp computeLevelFromXp. */
  level: number;
  /** Tổng XP tích lũy toàn thời gian. */
  xp: number;
  /** Mốc XP tại đầu level hiện tại. */
  currentLevelFloor: number;
  /** Mốc XP cần để lên level kế tiếp. */
  nextLevelFloor: number;
  /** XP đã tích lũy bên trong level hiện tại (xp - currentLevelFloor). */
  xpIntoLevel: number;
  /** XP còn thiếu để lên level kế tiếp (nextLevelFloor - xp). */
  xpToNextLevel: number;
  /** Độ rộng XP của level hiện tại (nextLevelFloor - currentLevelFloor). */
  levelSpan: number;
  /** % hoàn thành level hiện tại, làm tròn 1 chữ số thập phân, trong [0, 100]. */
  progressPercent: number;
}

/**
 * Tính tiến độ XP trong level hiện tại — dùng cho mọi UI cần vẽ progress bar
 * (mini XP bar ở trang chủ, thẻ Profile, v.v). Tách khỏi addXp() để có thể
 * gọi read-only mà không đụng tới DB.
 */
export function getXpProgress(xp: number): XpProgress {
  const safeXp = Math.max(0, xp);
  const level = computeLevelFromXp(safeXp);
  const currentLevelFloor = xpThresholdForLevel(level);
  const nextLevelFloor = xpThresholdForLevel(level + 1);
  const levelSpan = Math.max(1, nextLevelFloor - currentLevelFloor);
  const xpIntoLevel = safeXp - currentLevelFloor;

  return {
    level,
    xp: safeXp,
    currentLevelFloor,
    nextLevelFloor,
    xpIntoLevel,
    xpToNextLevel: Math.max(0, nextLevelFloor - safeXp),
    levelSpan,
    progressPercent:
      Math.round(Math.min(1, xpIntoLevel / levelSpan) * 1000) / 10,
  };
}

@Injectable()
export class GamificationService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) { }

  /**
   * Cộng XP cho user, tự động nhân đôi nếu XP boost (mua ở shop) còn hiệu
   * lực. Đây là ĐIỂM VÀO DUY NHẤT để cộng XP trong toàn bộ backend — mọi nơi
   * trả thưởng XP (Practice, Battle, Guild quest, v.v) phải gọi qua đây,
   * không được $inc trực tiếp vào gamification.xp, để: (1) level luôn đồng
   * bộ qua computeLevelFromXp(), (2) xpBoostExpiresAt (đã có sẵn ở schema và
   * shop.service.ts nhưng trước đây không nơi nào đọc) thực sự có tác dụng.
   */
  async addXp(userId: Types.ObjectId, amount: number): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const boostActive =
      !!user.gamification.xpBoostExpiresAt &&
      user.gamification.xpBoostExpiresAt.getTime() > Date.now();
    const baseAmount = Math.max(0, amount);
    const finalAmount = boostActive ? baseAmount * 2 : baseAmount;

    user.gamification.xp += finalAmount;
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