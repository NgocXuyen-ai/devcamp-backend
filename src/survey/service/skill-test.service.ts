import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CareerField, LessonLevel, QuestionType } from '../../common/enums';
import {
  Question,
  QuestionDocument,
} from '../../exercises/schemas/question.schema';
import { CodeRunnerService } from './code-runner.service';

/** Test case shown to the client (hidden ones are kept server-side) */
export interface PublicTestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
}

export interface CodingProblem {
  _id: Types.ObjectId;
  title: string;
  content: string;
  difficulty: string;
  language: 'javascript';
  starterCode: string;
  /** Suggested solving time for the problem (not execution timeout) */
  timeLimitSeconds: number;
  sampleTestCases: PublicTestCase[];
  totalTestCases: number;
}

export interface CodeSolution {
  questionId: string;
  code: string;
  timeSpentSeconds?: number;
}

export interface QuestionGrade {
  questionId: Types.ObjectId;
  submittedCode?: string;
  passedTestCases: number;
  totalTestCases: number;
  isCorrect: boolean;
  errorMessage?: string;
  timeSpentSeconds?: number;
}

export interface GradeResult {
  passedTestCases: number;
  totalTestCases: number;
  scorePercent: number;
  computedEntryLevel: LessonLevel;
  perQuestion: QuestionGrade[];
}

const MAX_PROBLEMS = 3;

const DEFAULT_STARTER_CODE = `/**
 * Implement and return your answer from solve().
 * The test-case input is passed as the argument(s).
 */
function solve(input) {
  // TODO: write your solution
}
`;

@Injectable()
export class SkillTestService {
  constructor(
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
    private readonly codeRunner: CodeRunnerService,
  ) {}

  /**
   * Pick 1–3 small coding problems matching the user's field focus.
   *  - frontend  → frontend questions (JS logic)
   *  - backend   → backend questions (API/logic/database)
   *  - fullstack → mix of both
   */
  async pickCodingProblems(
    field: CareerField,
    count = MAX_PROBLEMS,
  ): Promise<CodingProblem[]> {
    const size = Math.min(Math.max(count, 1), MAX_PROBLEMS);
    let docs: QuestionDocument[];

    if (field === CareerField.FULLSTACK) {
      const frontend = await this.sampleCodingQuestions(
        [CareerField.FRONTEND],
        Math.ceil(size / 2),
      );
      const backend = await this.sampleCodingQuestions(
        [CareerField.BACKEND],
        size - frontend.length,
        frontend.map((d) => d._id),
      );
      docs = [...frontend, ...backend];
      if (docs.length < size) {
        // Not enough in one pool — fill from any field.
        const fill = await this.sampleCodingQuestions(
          [CareerField.FRONTEND, CareerField.BACKEND, CareerField.FULLSTACK],
          size - docs.length,
          docs.map((d) => d._id),
        );
        docs.push(...fill);
      }
    } else {
      docs = await this.sampleCodingQuestions([field], size);
    }

    return docs.map((q) => this.toPublicProblem(q));
  }

  /**
   * Grade the submitted solutions against the question test cases (JS
   * only, no AI). Assigned questions left unsubmitted count as 0 passed.
   * Score = (passed test cases / total test cases) * 100.
   */
  async grade(
    assignedQuestionIds: Types.ObjectId[],
    solutions: CodeSolution[],
  ): Promise<GradeResult> {
    const questions = await this.questionModel.find({
      _id: { $in: assignedQuestionIds },
    });
    const solutionMap = new Map(solutions.map((s) => [s.questionId, s]));

    const perQuestion: QuestionGrade[] = [];
    for (const question of questions) {
      const totalTestCases = question.testCases.length;
      const solution = solutionMap.get(question._id.toString());
      if (!solution || !solution.code.trim()) {
        perQuestion.push({
          questionId: question._id,
          passedTestCases: 0,
          totalTestCases,
          isCorrect: false,
        });
        continue;
      }
      const evaluation = await this.codeRunner.evaluate(
        solution.code,
        question.testCases,
      );
      perQuestion.push({
        questionId: question._id,
        submittedCode: solution.code,
        passedTestCases: evaluation.passedCount,
        totalTestCases,
        isCorrect:
          totalTestCases > 0 && evaluation.passedCount === totalTestCases,
        errorMessage: evaluation.error,
        timeSpentSeconds: solution.timeSpentSeconds,
      });
    }

    const passedTestCases = perQuestion.reduce(
      (sum, q) => sum + q.passedTestCases,
      0,
    );
    const totalTestCases = perQuestion.reduce(
      (sum, q) => sum + q.totalTestCases,
      0,
    );
    const scorePercent = totalTestCases
      ? Math.round((passedTestCases / totalTestCases) * 100)
      : 0;

    const computedEntryLevel: LessonLevel =
      scorePercent >= 80
        ? LessonLevel.ADVANCED
        : scorePercent >= 60
          ? LessonLevel.INTERMEDIATE
          : LessonLevel.ROOT;

    return {
      passedTestCases,
      totalTestCases,
      scorePercent,
      computedEntryLevel,
      perQuestion,
    };
  }

  private async sampleCodingQuestions(
    fields: CareerField[],
    size: number,
    excludeIds: Types.ObjectId[] = [],
  ): Promise<QuestionDocument[]> {
    if (size <= 0) return [];
    return this.questionModel.aggregate<QuestionDocument>([
      {
        $match: {
          field: { $in: fields },
          type: QuestionType.CODING,
          isPublished: true,
          'testCases.0': { $exists: true },
          ...(excludeIds.length ? { _id: { $nin: excludeIds } } : {}),
        },
      },
      { $sample: { size } },
    ]);
  }

  private toPublicProblem(q: QuestionDocument): CodingProblem {
    const jsTemplate = q.templates?.find(
      (t) => t.language?.toLowerCase() === 'javascript',
    );
    return {
      _id: q._id,
      title: q.title,
      content: q.content,
      difficulty: q.difficulty,
      language: 'javascript',
      starterCode: jsTemplate?.starterCode || DEFAULT_STARTER_CODE,
      timeLimitSeconds: q.timeLimitSeconds ?? 300,
      sampleTestCases: q.testCases
        .filter((tc) => !tc.isHidden)
        .map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          explanation: tc.explanation,
        })),
      totalTestCases: q.testCases.length,
    };
  }
}
