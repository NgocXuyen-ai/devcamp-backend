import {
  Inject,
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Battle, BattleDocument, BattlePlayer } from '../schemas/battle.schema';
import { BattleMode, BattleStatus, CareerField } from '../../common/enums';
import { IQuestionService } from '../interfaces/question.interface';
import { QUESTION_SERVICE } from '../../questions/interfaces/question-service.token';
import { IQuestion } from '../interfaces/question.interface';

interface MatchInput {
  userId: string;
  username: string;
  avatar?: string;
  mode: BattleMode;
  field: CareerField;
}

@Injectable()
export class MatchmakingService {
  constructor(
    @InjectModel(Battle.name)
    @InjectModel(Battle.name)
    private readonly battleModel: Model<BattleDocument>,

    @Inject(QUESTION_SERVICE)
    private readonly questionsService: IQuestionService,
  ) {}
  // CHECK ACTIVE BATTLE
  async findActiveForUser(userId: string): Promise<BattleDocument | null> {
    return this.battleModel
      .findOne({
        'players.userId': new Types.ObjectId(userId),
        status: { $in: [BattleStatus.WAITING, BattleStatus.IN_PROGRESS] },
      })
      .lean();
  }

  // MAIN MATCH ENTRY

  async findOrCreate(input: MatchInput): Promise<BattleDocument> {
    const active = await this.findActiveForUser(input.userId);

    if (active) {
      throw new ConflictException(
        'You already have an active battle. Finish it first.',
      );
    }

    const newPlayer: BattlePlayer = {
      userId: new Types.ObjectId(input.userId),
      ratingBefore: 1000,
      score: 0,
      passedTestCount: 0,
      submissionCount: 0,
    };

    const joined = await this.tryJoinExistingBattle(input, newPlayer);
    if (joined) return joined;

    return this.createWaitingBattle(input, newPlayer);
  }

  // TRY JOIN EXISTING BATTLE

  private async tryJoinExistingBattle(
    input: MatchInput,
    newPlayer: BattlePlayer,
  ): Promise<BattleDocument | null> {
    const now = new Date();
    const timeLimitSeconds = input.mode === BattleMode.SPEED ? 600 : 1800;

    const questions = await this.buildQuestionsForMode(input.mode, input.field);

    const questionIds = questions.map((q) => new Types.ObjectId(q._id));

    const updated = await this.battleModel.findOneAndUpdate(
      {
        status: BattleStatus.WAITING,
        mode: input.mode,
        field: input.field,
        $expr: { $lt: [{ $size: '$players' }, 2] },
        'players.userId': {
          $ne: new Types.ObjectId(input.userId),
        },
      },
      {
        $push: { players: newPlayer },
        $set: {
          status: BattleStatus.IN_PROGRESS,
          startTime: now,
          expectedEndTime: new Date(now.getTime() + timeLimitSeconds * 1000),
          timeLimitSeconds,
          questionIds,
        },
      },
      { new: true },
    );

    return updated;
  }

  // CREATE WAITING BATTLE
  private async createWaitingBattle(
    input: MatchInput,
    newPlayer: BattlePlayer,
  ): Promise<BattleDocument> {
    const timeLimitSeconds = input.mode === BattleMode.SPEED ? 600 : 1800;

    const created = await this.battleModel.create({
      mode: input.mode,
      field: input.field,
      status: BattleStatus.WAITING,
      players: [newPlayer],
      questionIds: [],
      timeLimitSeconds,
    });

    if (!created) {
      throw new InternalServerErrorException('Failed to create battle');
    }

    return created;
  }

  // QUESTION BUILDER

  private async buildQuestionsForMode(
    mode: BattleMode,
    field: CareerField,
  ): Promise<IQuestion[]> {
    if (mode === BattleMode.SPEED) {
      return this.questionsService.findRandomByCriteria(field, 'easy', 1);
    }

    const [medium, hard] = await Promise.all([
      this.questionsService.findRandomByCriteria(field, 'medium', 2),
      this.questionsService.findRandomByCriteria(field, 'hard', 1),
    ]);

    return [...medium, ...hard];
  }
}
