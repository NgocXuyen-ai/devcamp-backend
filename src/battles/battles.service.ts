import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Battle, BattleDocument } from './schemas/battle.schema';
import {
  UserRanking,
  UserRankingDocument,
} from '../users/schemas/user-ranking.schema';
import {
  BattleSubmission,
  BattleSubmissionDocument,
} from './schemas/battle-submission.schema';

import { CreateBattleDto } from './dto/create-battle.dto';
import { GetHistoryDto } from './dto/get-history.dto';
import { GetLeaderboardDto } from './dto/get-leaderboard.dto';

import { BattleStatus, SubmissionStatus } from '../common/enums';

import { MatchmakingService } from './matchmaking/matchmaking.service';
import { MockQuestionsService } from './matchmaking/mock-questions.service';

import { BadRequestException } from '@nestjs/common';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

import { BattlesGateway } from './battles.gateway';

@Injectable()
export class BattlesService {
  private readonly battleTimers = new Map<string, NodeJS.Timeout>();
  constructor(
    @InjectModel(Battle.name)
    private readonly battleModel: Model<BattleDocument>,
    @InjectModel(BattleSubmission.name)
    private readonly submissionModel: Model<BattleSubmissionDocument>,
    @InjectModel(UserRanking.name)
    private readonly rankingModel: Model<UserRankingDocument>,
    private readonly matchmakingService: MatchmakingService,
    private readonly questionsService: MockQuestionsService,
    private readonly gateway: BattlesGateway,
  ) {}

  async createBattle(
    user: { userId: string; username: string; avatar?: string },
    dto: CreateBattleDto,
  ) {
    const battle = await this.matchmakingService.findOrCreate({
      userId: user.userId,
      username: user.username,
      avatar: user.avatar,
      mode: dto.mode,
      field: dto.field,
    });

    if (battle.status === BattleStatus.IN_PROGRESS) {
      // this.startBattleTimer(String(battle._id), battle.timeLimit);
      this.gateway.notifyBattleStarted(String(battle._id), battle);
    }
    return battle;
  }
  async getBattleById(battleId: string, userId: string) {
    if (!Types.ObjectId.isValid(battleId)) {
      throw new NotFoundException('Battle not found!');
    }

    const battle = await this.battleModel.findById(battleId).lean();
    if (!battle) {
      throw new NotFoundException('Battle not found!');
    }

    const isPlayer = battle.players.some((p) => p.userId.toString() == userId);
    if (!isPlayer) {
      throw new ForbiddenException('You are not player of this battle');
    }
    return battle;
  }
  async getUserHistory(userId: string, dto: GetHistoryDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;

    const filter = {
      'players.userId': new Types.ObjectId(userId),
      status: { $in: [BattleStatus.FINISHED, BattleStatus.CANCELLED] },
    };
    const [items, total] = await Promise.all([
      this.battleModel
        .find(filter)
        .sort({ endTime: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.battleModel.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async getLeaderboard(dto: GetLeaderboardDto) {
    const limit = dto.limit ?? 20;

    const rankings = await this.rankingModel
      .find({ field: dto.field })
      .sort({ ratingPoints: -1, winRate: -1 })
      .limit(limit)
      .lean();
    return rankings;
  }

  async submitAnswer(battleId: string, userId: string, dto: SubmitAnswerDto) {
    if (!Types.ObjectId.isValid(battleId)) {
      throw new NotFoundException('Battle not found');
    }

    const battle = await this.battleModel.findById(battleId);
    if (!battle) {
      throw new NotFoundException('Battle not found');
    }

    if (battle.status !== BattleStatus.IN_PROGRESS) {
      throw new BadRequestException('Battle is not in progress');
    }

    const playerIndex = battle.players.findIndex(
      (p) => p.userId.toString() === userId,
    );
    if (playerIndex == -1) {
      throw new ForbiddenException('You are not a player of this battle');
    }

    const isQuestionInBattle = battle.questionIds.some(
      (q) => q.toString() == dto.questionId,
    );
    if (!isQuestionInBattle) {
      throw new BadRequestException('Question not found in this battle');
    }

    const question = await this.questionsService.findById(dto.questionId);
    if (!question) {
      throw new BadRequestException('Question not found');
    }

    const existingSubmission = await this.submissionModel.findOne({
      battleId: new Types.ObjectId(battleId),
      userId: new Types.ObjectId(userId),
      questionId: new Types.ObjectId(dto.questionId),
      status: SubmissionStatus.ACCEPTED,
    });

    if (existingSubmission) {
      throw new BadRequestException(
        'You already answered this question correctly',
      );
    }

    const isCorrect =
      dto.answer.trim() === (question.correctAnswer ?? '').trim();

    const player = battle.players[playerIndex];
    const newScore = isCorrect
      ? player.score + 10
      : Math.max(0, player.score - 3);
    const pointsChange = newScore - player.score;

    await Promise.all([
      this.submissionModel.create({
        battleId: new Types.ObjectId(battleId),
        userId: new Types.ObjectId(userId),
        questionId: new Types.ObjectId(dto.questionId),
        language: 'text',
        code: dto.answer,
        status: isCorrect
          ? SubmissionStatus.ACCEPTED
          : SubmissionStatus.WRONG_ANSWER,
        pointsEarned: pointsChange,
        elapsedSeconds: battle.startTime
          ? Math.floor((Date.now() - battle.startTime.getTime()) / 1000)
          : 0,
      }),
      this.battleModel.findByIdAndUpdate(battleId, {
        $set: {
          [`players.${playerIndex}.score`]: newScore,
        },
        $inc: {
          [`players.${playerIndex}.submissionCount`]: 1,
        },
      }),
    ]);

    if (isCorrect) {
      const questionOrder = battle.questionIds.findIndex(
        (q) => q.toString() === dto.questionId,
      );

      this.gateway.notifyCorrectSubmit(battleId, {
        userId,
        questionId: dto.questionId,
        questionOrder,
        currentScore: newScore,
      });
    }

    const correctCount = await this.submissionModel.countDocuments({
      battleId: new Types.ObjectId(battleId),
      userId: new Types.ObjectId(userId),
      status: SubmissionStatus.ACCEPTED,
    });

    if (correctCount >= battle.questionIds.length) {
      await this.endBattle(battleId);
    }
    return {
      isCorrect,
      points: pointsChange,
      currentScore: newScore,
      currentQuestionIndex: correctCount,
      message: isCorrect ? 'Correct' : 'Wrong answer, -3 points',
    };
  }

  async endBattle(battleId: string) {
    const battle = await this.battleModel.findById(battleId);
    if (!battle) {
      throw new NotFoundException('Battle not found');
    }
    if (battle.status !== BattleStatus.IN_PROGRESS) {
      throw new BadRequestException('Battle is not in progress');
    }

    const [p1, p2] = battle.players;
    const isDraw = p1.score === p2.score;
    const winner = isDraw ? null : p1.score > p2.score ? p1 : p2;
    const loser = isDraw
      ? null
      : winner?.userId.toString() === p1.userId.toString()
        ? p2
        : p1;

    const finalScores = battle.players.map((p) => ({
      userId: p.userId.toString(),
      score: p.score,
    }));

    await this.battleModel.findByIdAndUpdate(battleId, {
      $set: {
        status: BattleStatus.FINISHED,
        endTime: new Date(),
        winnerId: winner?.userId ?? null,
        isDraw,
      },
    });

    const endResult = {
      battleId,
      isDraw,
      winner: winner ? { userId: winner.userId.toString() } : null,
      loser: loser ? { userId: loser.userId.toString() } : null,
      finalScores,
    };

    await this.updateRankings(battle, winner?.userId ?? null, isDraw);

    this.stopBattleTimer(battleId);
    this.gateway.notifyBattleEnded(battleId, {
      winnerId: winner?.userId.toString(),
      isDraw,
      finalScores,
    });
    return endResult;
  }
  async getSubmissions(battleId: string, userId?: string) {
    if (!Types.ObjectId.isValid(battleId)) {
      throw new NotFoundException('Battle not foun');
    }
    const filter: Record<string, unknown> = {
      battleId: new Types.ObjectId(battleId),
    };
    if (userId && Types.ObjectId.isValid(userId)) {
      filter.userId = new Types.ObjectId(userId);
    }

    return this.submissionModel.find(filter).sort({ createdAt: 1 }).lean();
  }

  startBattleTimer(battleId: string, timeLimit: number) {
    if (this.battleTimers.has(battleId)) return;

    let timeRemaining = timeLimit;

    const interval = setInterval(() => {
      timeRemaining--;
      this.gateway.pushTimerTick(battleId, timeRemaining);

      if (timeRemaining <= 0) {
        this.stopBattleTimer(battleId);
        this.endBattle(battleId).catch(() => {});
      }
    }, 1000);
    this.battleTimers.set(battleId, interval);
  }
  stopBattleTimer(battleId: string) {
    const interval = this.battleTimers.get(battleId);
    if (interval) {
      clearInterval(interval);
      this.battleTimers.delete(battleId);
    }
  }
  async abandonBattle(battleId: string, userId: string) {
    if (!Types.ObjectId.isValid(battleId))
      throw new NotFoundException('Battle not found');

    const battle = await this.battleModel.findById(battleId);
    if (!battle) throw new NotFoundException('Battle not found');
    if (
      battle.status !== BattleStatus.IN_PROGRESS &&
      battle.status !== BattleStatus.WAITING
    ) {
      throw new BadRequestException('Battle already ended');
    }

    const opponent = battle.players.find((p) => p.userId.toString() !== userId);

    const finalScores = battle.players.map((p) => ({
      userId: p.userId.toString(),
      score: p.score,
    }));

    await this.battleModel.findByIdAndUpdate(battleId, {
      $set: {
        status: BattleStatus.CANCELLED,
        endTime: new Date(),
        winnerId: opponent?.userId ?? null,
        isDraw: false,
      },
    });

    await this.updateRankings(battle, opponent?.userId ?? null, false);

    this.stopBattleTimer(battleId);

    this.gateway.notifyBattleEnded(battleId, {
      winnerId: opponent?.userId.toString(),
      isDraw: false,
      finalScores,
    });
    return {
      message: 'Battle abandoned',
      winnerId: opponent?.userId.toString(),
    };
  }

  async cancelMatchmaking(battleId: string, userId: string) {
    if (!Types.ObjectId.isValid(battleId)) {
      throw new NotFoundException('Battle not found');
    }

    const battle = await this.battleModel.findById(battleId).lean();
    if (!battle) {
      throw new NotFoundException('Battle not found');
    }

    const isPlayer = battle.players.some((p) => p.userId.toString() === userId);
    if (!isPlayer) {
      throw new ForbiddenException('You are not a player of this battle');
    }

    if (battle.status !== BattleStatus.WAITING) {
      throw new BadRequestException(
        'Battle is no longer waiting — an opponent may already be matched',
      );
    }

    // Atomic: chỉ cancel nếu status vẫn còn WAITING ngay tại thời điểm update
    const cancelled = await this.battleModel.findOneAndUpdate(
      { _id: battleId, status: BattleStatus.WAITING },
      { $set: { status: BattleStatus.CANCELLED, endTime: new Date() } },
      { new: true },
    );

    if (!cancelled) {
      throw new BadRequestException(
        'Battle is no longer waiting — an opponent may already be matched',
      );
    }

    return { message: 'Matchmaking cancelled', battleId };
  }

  private async updateRankings(
    battle: BattleDocument,
    winnerId: Types.ObjectId | null,
    isDraw: boolean,
  ) {
    const updates = battle.players.map(async (p) => {
      const isWinner = !isDraw && winnerId?.toString() === p.userId.toString();
      const isLoser = !isDraw && !isWinner;

      const updated = await this.rankingModel
        .findOneAndUpdate(
          { userId: p.userId, field: battle.field },
          {
            $inc: {
              totalBattles: 1,
              wins: isWinner ? 1 : 0,
              losses: isLoser ? 1 : 0,
              draws: isDraw ? 1 : 0,
            },
          },
          { upsert: true, new: true },
        )
        .lean();
      const winRate =
        updated.totalBattles > 0 ? updated.wins / updated.totalBattles : 0;

      await this.rankingModel.findByIdAndUpdate(updated._id, {
        $set: { winRate },
      });
    });
    await Promise.all(updates);
  }
}
