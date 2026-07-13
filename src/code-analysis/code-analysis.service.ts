import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AnalysisResource,
  CodeAnalysis,
  CodeAnalysisDocument,
} from './schemas/code-analysis.schema';
import { GroqAnalysisProvider } from './providers/groq-analysis.provider';

interface ShapeableAnalysis {
  _id: Types.ObjectId | string;
  battleId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  code: string;
  language: string;
  summary: string;
  strengths?: string[];
  improvements?: string[];
  refactoringSuggestion?: string;
  resources?: AnalysisResource[];
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class CodeAnalysisService {
  private readonly logger = new Logger(CodeAnalysisService.name);

  constructor(
    @InjectModel(CodeAnalysis.name)
    private readonly model: Model<CodeAnalysisDocument>,
    private readonly groqProvider: GroqAnalysisProvider,
  ) {}

  private shape(doc: ShapeableAnalysis) {
    return {
      _id: String(doc._id),
      battleId: String(doc.battleId),
      userId: String(doc.userId),
      code: doc.code,
      language: doc.language,
      summary: doc.summary,
      strengths: doc.strengths ?? [],
      improvements: doc.improvements ?? [],
      refactoringSuggestion: doc.refactoringSuggestion ?? '',
      resources: doc.resources ?? [],
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async create(
    userId: Types.ObjectId,
    battleId: string,
    code: string,
    language = 'javascript',
  ) {
    if (!Types.ObjectId.isValid(battleId)) {
      throw new NotFoundException('Battle not found');
    }

    let result;
    try {
      this.logger.log('Calling Groq AI for code analysis...');
      result = await this.groqProvider.analyze(code, language);
      this.logger.log('Groq AI analysis completed');
    } catch (err) {
      this.logger.warn(`Groq failed, using static fallback: ${String(err)}`);
      result = this.staticAnalyze(code, language);
    }

    const doc = await this.model.findOneAndUpdate(
      { battleId: new Types.ObjectId(battleId), userId },
      {
        $set: {
          code,
          language,
          status: 'completed',
          ...result,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return this.shape(doc.toObject());
  }

  async getByBattle(userId: Types.ObjectId, battleId: string) {
    if (!Types.ObjectId.isValid(battleId)) {
      throw new NotFoundException('Analysis not found');
    }
    const doc = await this.model
      .findOne({ battleId: new Types.ObjectId(battleId), userId })
      .lean();
    if (!doc) throw new NotFoundException('Analysis not found');
    return this.shape(doc);
  }

  /** Fallback khi Groq API lỗi — giữ app không crash */
  private staticAnalyze(code: string, language: string) {
    const lines = code.split('\n');
    const loc = lines.filter((l) => l.trim().length > 0).length;
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (/\b(const|let)\b/.test(code))
      strengths.push('Uses block-scoped declarations (const/let).');
    if (/=>/.test(code)) strengths.push('Uses modern arrow-function syntax.');
    if (loc <= 40) strengths.push('Solution is concise and focused.');
    if (strengths.length === 0)
      strengths.push('Produces a working solution to the problem.');

    if (/\bvar\b/.test(code))
      improvements.push('Replace `var` with `const`/`let`.');
    if (!/(\/\/|\/\*)/m.test(code))
      improvements.push('Add brief comments for non-obvious logic.');
    if (!/\btry\b/.test(code))
      improvements.push('Consider guarding edge cases / invalid input.');

    const summary = `Reviewed ~${loc} lines of ${language}. Found ${improvements.length} areas to improve and ${strengths.length} strengths.`;

    return {
      summary,
      strengths,
      improvements,
      refactoringSuggestion:
        'Extract repeated logic into helpers and add input-validation guards.',
      resources: this.resourcesFor(language),
    };
  }

  private resourcesFor(language: string): AnalysisResource[] {
    const lang = language.toLowerCase();
    if (lang.includes('python')) {
      return [
        {
          title: 'PEP 8 – Style Guide',
          url: 'https://peps.python.org/pep-0008/',
        },
        { title: 'Big-O Cheat Sheet', url: 'https://www.bigocheatsheet.com/' },
      ];
    }
    return [
      {
        title: 'MDN – JavaScript Guide',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
      },
      {
        title: 'Clean Code JavaScript',
        url: 'https://github.com/ryanmcdermott/clean-code-javascript',
      },
      { title: 'Big-O Cheat Sheet', url: 'https://www.bigocheatsheet.com/' },
    ];
  }
}
