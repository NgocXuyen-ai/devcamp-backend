import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  CodeAnalysis,
  CodeAnalysisDocument,
} from './schemas/code-analysis.schema';
import { Battle, BattleDocument } from '../battles/schemas/battle.schema';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { AI_PROVIDER, IAiProvider } from './interfaces/ai-provider.interface';
import { BattleStatus } from '../common/enums';

@Injectable()
export class CodeAnalysisService {
  constructor(
    @InjectModel(CodeAnalysis.name)
    private readonly analysisModel: Model<CodeAnalysisDocument>,
    @InjectModel(Battle.name)
    private readonly battleModel: Model<BattleDocument>,
    @Inject(AI_PROVIDER)
    private readonly aiProvider: IAiProvider,
  ) {}

  async createAnalysis(userId: string, dto: CreateAnalysisDto) {
    console.log('createAnalysis called', { userId, battleId: dto.battleId });
    if (!Types.ObjectId.isValid(dto.battleId)) {
      throw new NotFoundException('Battle not found');
    }

    const battle = await this.battleModel.findById(dto.battleId).lean();
    if (!battle) {
      throw new NotFoundException('Battle not found');
    }
    if (battle.status !== BattleStatus.COMPLETED) {
      throw new BadRequestException('Battle must be completed before analysis');
    }
    const existing = await this.analysisModel
      .findOne({
        battleId: new Types.ObjectId(dto.battleId),
        userId: new Types.ObjectId(userId),
      })
      .lean();
    if (existing) {
      throw new BadRequestException(
        'You already have an analysis for this battle',
      );
    }

    const analysis = await this.analysisModel.create({
      battleId: new Types.ObjectId(dto.battleId),
      userId: new Types.ObjectId(userId),
      code: dto.code,
      language: dto.language,
      status: 'pending',
    });

    try {
      const result = await this.aiProvider.analyze({
        code: dto.code,
        language: dto.language,
        testResults: dto.testResults,
      });

      await this.analysisModel.findByIdAndUpdate(analysis._id, {
        $set: {
          status: 'completed',
          summary: result.summary,
          strengths: result.strengths,
          improvements: result.improvements,
          refactoringSuggestion: result.refactoringSuggestion,
          resources: result.resources,
        },
      });

      await this.battleModel.findByIdAndUpdate(dto.battleId, {
        $set: { codeAnalysisId: analysis._id },
      });
    } catch (error) {
      console.error('AI analysis error:', error);
      await this.analysisModel.findByIdAndUpdate(analysis._id, {
        $set: { status: 'failed' },
      });
      throw new BadRequestException('AI analysis failed, please try again');
    }
    return this.analysisModel.findById(analysis._id).lean();
  }
  async getAnalysisByBattleId(battleId: string, userId: string) {
    if (!Types.ObjectId.isValid(battleId)) {
      throw new NotFoundException('Battle not found');
    }
    const analysis = await this.analysisModel
      .findOne({
        battleId: new Types.ObjectId(battleId),
        userId: new Types.ObjectId(userId),
      })
      .lean();
    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    return analysis;
  }
}
