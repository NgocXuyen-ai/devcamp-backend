import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CareerField } from '../../common/enums';
import {
  UserRanking,
  UserRankingDocument,
} from '../schemas/user-ranking.schema';

/** Classic ELO K factor. Larger = bigger swings. */
const K_FACTOR = 32;

/** Tier thresholds — display only, doesn't affect matchmaking. */
const TIERS: Array<{ min: number; tier: string }> = [
  { min: 2400, tier: 'Archmage' },
  { min: 2000, tier: 'Master' },
  { min: 1600, tier: 'Diamond' },
  { min: 1300, tier: 'Gold' },
  { min: 1100, tier: 'Silver' },
  { min: 0, tier: 'Bronze' },
];

export function tierFromRating(rating: number): string {
  return TIERS.find((t) => rating >= t.min)?.tier ?? 'Bronze';
}

@Injectable()
export class UserRankingService {
  constructor(
    @InjectModel(UserRanking.name)
    private readonly rankingModel: Model<UserRankingDocument>,
  ) {}

  async getOrCreate(
    userId: Types.ObjectId,
    field: CareerField,
  ): Promise<UserRankingDocument> {
    const existing = await this.rankingModel.findOne({ userId, field });
    if (existing) return existing;
    return this.rankingModel.create({ userId, field, ratingPoints: 1000 });
  }

  async getForUser(userId: Types.ObjectId): Promise<UserRankingDocument[]> {
    return this.rankingModel.find({ userId });
  }

  async updateAfterBattle(params: {
    winnerId: Types.ObjectId;
    loserId: Types.ObjectId;
    field: CareerField;
    isDraw?: boolean;
  }): Promise<{ winner: UserRankingDocument; loser: UserRankingDocument }> {
    const winner = await this.getOrCreate(params.winnerId, params.field);
    const loser = await this.getOrCreate(params.loserId, params.field);

    const expectedWinner =
      1 / (1 + Math.pow(10, (loser.ratingPoints - winner.ratingPoints) / 400));
    const expectedLoser = 1 - expectedWinner;

    const scoreWinner = params.isDraw ? 0.5 : 1;
    const scoreLoser = params.isDraw ? 0.5 : 0;

    const newWinnerRating = Math.round(
      winner.ratingPoints + K_FACTOR * (scoreWinner - expectedWinner),
    );
    const newLoserRating = Math.round(
      loser.ratingPoints + K_FACTOR * (scoreLoser - expectedLoser),
    );

    winner.ratingPoints = newWinnerRating;
    winner.peakRating = Math.max(winner.peakRating, newWinnerRating);
    winner.totalBattles += 1;
    winner.tier = tierFromRating(newWinnerRating);
    winner.lastBattleAt = new Date();
    if (params.isDraw) winner.draws += 1;
    else winner.wins += 1;
    winner.winRate = winner.totalBattles
      ? winner.wins / winner.totalBattles
      : 0;

    loser.ratingPoints = newLoserRating;
    loser.peakRating = Math.max(loser.peakRating, newLoserRating);
    loser.totalBattles += 1;
    loser.tier = tierFromRating(newLoserRating);
    loser.lastBattleAt = new Date();
    if (params.isDraw) loser.draws += 1;
    else loser.losses += 1;
    loser.winRate = loser.totalBattles ? loser.wins / loser.totalBattles : 0;

    await Promise.all([winner.save(), loser.save()]);
    return { winner, loser };
  }

  async getLeaderboard(
    field: CareerField | undefined,
    skip: number,
    limit: number,
  ) {
    const filter = field ? { field } : {};
    const [items, total] = await Promise.all([
      this.rankingModel
        .find(filter)
        .sort({ ratingPoints: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username avatarUrl'),
      this.rankingModel.countDocuments(filter),
    ]);
    return { items, total };
  }
}
