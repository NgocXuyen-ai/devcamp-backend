import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AnalysisResource,
  CodeAnalysis,
  CodeAnalysisDocument,
} from './schemas/code-analysis.schema';

interface AnalysisResult {
  summary: string;
  strengths: string[];
  improvements: string[];
  refactoringSuggestion: string;
  resources: AnalysisResource[];
}

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
  constructor(
    @InjectModel(CodeAnalysis.name)
    private readonly model: Model<CodeAnalysisDocument>,
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
    const result = this.analyze(code, language);
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

  /**
   * Deterministic, dependency-free static review. Inspects simple code signals
   * to produce useful feedback. Swap this for a real LLM call when available.
   */
  private analyze(code: string, language: string): AnalysisResult {
    const lines = code.split('\n');
    const loc = lines.filter((l) => l.trim().length > 0).length;
    const strengths: string[] = [];
    const improvements: string[] = [];

    const hasComments = /(^|\s)(\/\/|\/\*|\*|#)/m.test(code);
    const usesVar = /\bvar\b/.test(code);
    const usesConstLet = /\b(const|let)\b/.test(code);
    const hasNestedLoops = /for[\s\S]{0,400}for|while[\s\S]{0,400}while/.test(
      code,
    );
    const longFunctions = loc > 60;
    const hasTryCatch = /\btry\b[\s\S]*\bcatch\b/.test(code);
    const usesArrow = /=>/.test(code);
    const hasMagicNumbers = /[^.\w](\d{2,})(?![\w.])/.test(code);

    if (usesConstLet) {
      strengths.push('Uses block-scoped declarations (const/let).');
    }
    if (usesArrow) strengths.push('Uses modern arrow-function syntax.');
    if (hasComments) strengths.push('Includes comments explaining intent.');
    if (hasTryCatch) strengths.push('Handles errors with try/catch.');
    if (loc <= 40) strengths.push('Solution is concise and focused.');
    if (strengths.length === 0) {
      strengths.push('Produces a working solution to the problem.');
    }

    if (usesVar) {
      improvements.push(
        'Replace `var` with `const`/`let` to avoid scope bugs.',
      );
    }
    if (!hasComments) {
      improvements.push('Add brief comments for non-obvious logic.');
    }
    if (hasNestedLoops) {
      improvements.push(
        'Nested loops detected — consider a map/set to lower time complexity.',
      );
    }
    if (longFunctions) {
      improvements.push(
        'Function is long — split it into smaller, testable helpers.',
      );
    }
    if (hasMagicNumbers) {
      improvements.push('Extract magic numbers into named constants.');
    }
    if (!hasTryCatch) {
      improvements.push('Consider guarding edge cases / invalid input.');
    }

    const summary =
      `Reviewed ~${loc} lines of ${language}. ` +
      (improvements.length <= 1
        ? 'Clean solution with only minor polish suggested.'
        : `Found ${improvements.length} areas to improve and ${strengths.length} strengths.`);

    const refactoringSuggestion = hasNestedLoops
      ? 'Try trading the nested iteration for a hash-based lookup (object/Map) to bring the hot path closer to O(n).'
      : usesVar
        ? 'Modernize the declarations (var → const/let) and group related logic into small pure functions.'
        : 'Extract repeated logic into helpers and add input-validation guards at the top of the function.';

    return {
      summary,
      strengths,
      improvements,
      refactoringSuggestion,
      resources: this.resourcesFor(language),
    };
  }

  private resourcesFor(language: string): AnalysisResource[] {
    const lang = language.toLowerCase();
    if (lang.includes('python')) {
      return [
        {
          title: 'PEP 8 – Style Guide for Python',
          url: 'https://peps.python.org/pep-0008/',
        },
        {
          title: 'Big-O Cheat Sheet',
          url: 'https://www.bigocheatsheet.com/',
        },
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
      {
        title: 'Big-O Cheat Sheet',
        url: 'https://www.bigocheatsheet.com/',
      },
    ];
  }
}
