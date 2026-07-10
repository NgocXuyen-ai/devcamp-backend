import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  OnModuleInit,
  Logger,
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
import { Inject } from '@nestjs/common';
import { IQuestionService } from './interfaces/question.interface';
import { QUESTION_SERVICE } from '../questions/interfaces/question-service.token';

import { BadRequestException } from '@nestjs/common';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

import { BattlesGateway } from './battles.gateway';
import { CodeJudgeService } from '../code-execution/code-judge.service';

export interface LeaderboardRow {
  rank: number;
  userId: string;
  username: string;
  field: string;
  ratingPoints: number;
  totalBattles: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  tier: string;
}

@Injectable()
export class BattlesService implements OnModuleInit {
  private readonly logger = new Logger(BattlesService.name);
  private readonly battleTimers = new Map<string, NodeJS.Timeout>();
  constructor(
    @Inject(QUESTION_SERVICE)
    private readonly questionsService: IQuestionService,
    @InjectModel(Battle.name)
    private readonly battleModel: Model<BattleDocument>,
    @InjectModel(BattleSubmission.name)
    private readonly submissionModel: Model<BattleSubmissionDocument>,
    @InjectModel(UserRanking.name)
    private readonly rankingModel: Model<UserRankingDocument>,
    private readonly matchmakingService: MatchmakingService,
    // private readonly questionsService: MockQuestionsService,
    private readonly gateway: BattlesGateway,
    private readonly codeJudgeService: CodeJudgeService,
  ) {}

  async onModuleInit() {
    this.logger.log('🔄 Cleaning up stuck battles...');

    const now = new Date();

    // Case 1: IN_PROGRESS + đã hết expectedEndTime → kết thúc
    const expiredBattles = await this.battleModel.find({
      status: BattleStatus.IN_PROGRESS,
      expectedEndTime: { $lte: now },
    });

    for (const battle of expiredBattles) {
      try {
        await this.endBattle(String(battle._id));
        this.logger.log(`✅ Ended expired battle: ${String(battle._id)}`);
      } catch (error) {
        this.logger.warn(
          `⚠️ Failed to end battle ${String(battle._id)}: ${String(error)}`,
        );
      }
    }

    // Case 2: IN_PROGRESS + chưa hết expectedEndTime → khôi phục timer
    const activeBattles = await this.battleModel.find({
      status: BattleStatus.IN_PROGRESS,
      expectedEndTime: { $gt: now },
    });

    for (const battle of activeBattles) {
      const remainingMs = battle.expectedEndTime!.getTime() - now.getTime();
      const remainingSeconds = Math.floor(remainingMs / 1000);

      if (remainingSeconds > 0) {
        this.startBattleTimer(String(String(battle._id)), remainingSeconds);
        this.logger.log(
          `🔁 Restored timer for battle ${String(battle._id)} (${remainingSeconds}s left)`,
        );
      } else {
        try {
          await this.endBattle(String(String(battle._id)));
          this.logger.log(`✅ Ended battle (edge case): ${String(battle._id)}`);
        } catch (error: unknown) {
          this.logger.warn(
            `⚠️ Failed to end battle ${String(battle._id)}: ${String(error)}`,
          );
        }
      }
    }

    // Case 3: WAITING quá lâu (> 5 phút) → hủy
    const staleThreshold = new Date(now.getTime() - 5 * 60 * 1000);
    const staleBattles = await this.battleModel.find({
      status: BattleStatus.WAITING,
      createdAt: { $lte: staleThreshold },
    });

    if (staleBattles.length > 0) {
      await this.battleModel.updateMany(
        { _id: { $in: staleBattles.map((b) => b._id) } },
        {
          $set: {
            status: BattleStatus.CANCELLED,
            endTime: now,
          },
        },
      );
      this.logger.log(
        `🗑️ Cancelled ${staleBattles.length} stale WAITING battles`,
      );
    }

    this.logger.log('✅ Cleanup done');
  }
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
      this.startBattleTimer(
        String(String(battle._id)),
        battle.timeLimitSeconds,
      );
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
    const questions = await Promise.all(
      battle.questionIds.map(async (qId) => {
        const q = await this.questionsService.findById(qId.toString());
        if (!q) return null;
        return {
          questionId: q._id.toString(),
          title: q.title,
          content: q.content,
          difficulty: q.difficulty,
        };
      }),
    );

    return {
      ...battle,
      questions: questions.filter((q) => q !== null),
    };
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
  async getLeaderboard(dto: GetLeaderboardDto): Promise<LeaderboardRow[]> {
    const limit = dto.limit ?? 20;

    const rankings = await this.rankingModel
      .find({ field: dto.field })
      .sort({ ratingPoints: -1, winRate: -1 })
      .limit(limit)
      .populate({ path: 'userId', select: 'username' })
      .lean();

    // Trả kèm `username` + `rank` để FE hiển thị bảng xếp hạng trực tiếp.
    return rankings.map((r, index): LeaderboardRow => {
      const populated = r.userId as unknown as {
        _id?: Types.ObjectId;
        username?: string;
      } | null;
      return {
        rank: index + 1,
        userId: populated?._id ? String(populated._id) : String(r.userId),
        username: populated?.username ?? 'Unknown',
        field: r.field,
        ratingPoints: r.ratingPoints,
        totalBattles: r.totalBattles,
        wins: r.wins,
        losses: r.losses,
        draws: r.draws,
        winRate: r.winRate,
        tier: r.tier,
      };
    });
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

    let isCorrect = false;
    let judgeDetails: {
      totalTests: number;
      passedTests: number;
      testResults: {
        input: string;
        expectedOutput: string;
        actualOutput: string | null;
        passed: boolean;
        error: string | null;
      }[];
    } | null = null;

    if (question.type === 'coding') {
      // Lấy starterCode từ templates
      const templates = question.templates as
        | { starterCode?: string }[]
        | undefined;
      const starterCode = templates?.[0]?.starterCode ?? '';
      const functionName =
        this.codeJudgeService.extractFunctionName(starterCode);

      const testCasesData = (question.testCases ?? []) as {
        input: string;
        expectedOutput: string;
      }[];

      const judgeResult = await this.codeJudgeService.judgeCode(
        dto.answer,
        functionName,
        testCasesData,
        'javascript',
      );

      isCorrect = judgeResult.isCorrect;
      judgeDetails = judgeResult;
    } else {
      // output_prediction / fill_blank — so sánh string
      const testCases = question.testCases as
        | { expectedOutput?: string }[]
        | undefined;
      const expectedAnswer = testCases?.[0]?.expectedOutput ?? '';

      isCorrect =
        dto.answer.trim().toLowerCase() === expectedAnswer.trim().toLowerCase();
    }

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
      ...(judgeDetails && { judgeDetails }),
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
