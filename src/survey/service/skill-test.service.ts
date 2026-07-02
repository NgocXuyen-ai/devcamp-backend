import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CareerField, LessonLevel, SkillLevel } from '../../common/enums';
import {
  Question,
  QuestionDocument,
} from '../../exercises/schemas/question.schema';
import { CodeRunnerService } from './code-runner.service';
import {
  SURVEY_PROBLEM_BANK,
  SurveyCodingProblemDefinition,
} from './survey-problems.data';

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
  track: CareerField;
  targetSkillLevel: SkillLevel;
  language: 'javascript';
  starterCode: string;
  /** Suggested solving time for the problem (not execution timeout) */
  timeLimitSeconds: number;
  estimatedMinutes: number;
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

export interface SkillTestCaseRunResult {
  index: number;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed: boolean;
  errorMessage?: string;
  isHidden: boolean;
}

export interface SkillTestRunResult {
  questionId: string;
  status: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Time Limit Exceeded';
  passedCount: number;
  total: number;
  notes: string;
  errorMessage?: string;
  cases: SkillTestCaseRunResult[];
}

export interface CodingProblemPoolSnapshot {
  poolSize: number;
  poolBreakdown: Partial<Record<CareerField, number>>;
}

const MAX_PROBLEMS = 5;
const DEFAULT_PROBLEM_COUNT_BY_LEVEL: Record<SkillLevel, number> = {
  [SkillLevel.NOVICE]: 5,
  [SkillLevel.APPRENTICE]: 5,
  [SkillLevel.JOURNEYMAN]: 5,
  [SkillLevel.MASTER]: 5,
};
const LEVEL_ORDER = [
  SkillLevel.NOVICE,
  SkillLevel.APPRENTICE,
  SkillLevel.JOURNEYMAN,
  SkillLevel.MASTER,
];

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
  pickCodingProblems(
    field: CareerField,
    selfLevel?: SkillLevel,
    count?: number,
  ): Promise<CodingProblem[]> {
    const selectedLevel = selfLevel ?? SkillLevel.APPRENTICE;
    const size = this.resolveRequestedProblemCount(selectedLevel, count);
    const curatedProblems = this.pickFallbackProblems(
      field,
      selectedLevel,
      size,
    );
    return Promise.resolve(
      curatedProblems.map((problem) => this.toPublicFallbackProblem(problem)),
    );
  }

  getProblemPoolSnapshot(
    field: CareerField,
    selectedLevel: SkillLevel,
  ): CodingProblemPoolSnapshot {
    const levelPool = SURVEY_PROBLEM_BANK.filter(
      (problem) =>
        problem.targetSkillLevel === selectedLevel &&
        (field === CareerField.FULLSTACK || problem.field === field),
    );

    const poolBreakdown = levelPool.reduce<
      Partial<Record<CareerField, number>>
    >((acc, problem) => {
      acc[problem.field] = (acc[problem.field] ?? 0) + 1;
      return acc;
    }, {});

    return {
      poolSize: levelPool.length,
      poolBreakdown,
    };
  }

  /**
   * Grade the submitted solutions against the question test cases (JS
   * only, no AI). Assigned questions left unsubmitted count as 0 passed.
   * Score = (passed test cases / total test cases) * 100.
   */
  async grade(
    assignedQuestionIds: Types.ObjectId[],
    solutions: CodeSolution[],
    selectedLevel?: SkillLevel,
  ): Promise<GradeResult> {
    const solutionMap = new Map(solutions.map((s) => [s.questionId, s]));

    const perQuestion: QuestionGrade[] = [];
    for (const assignedId of assignedQuestionIds) {
      const questionId = assignedId.toString();
      const problemSource = await this.getProblemSource(questionId);
      const totalTestCases = this.getAllTestCases(problemSource).length;
      const solution = solutionMap.get(questionId);

      if (!solution || !solution.code.trim()) {
        perQuestion.push({
          questionId: assignedId,
          passedTestCases: 0,
          totalTestCases,
          isCorrect: false,
        });
        continue;
      }

      const evaluation = await this.runEvaluation(
        problemSource,
        solution.code,
        true,
      );
      perQuestion.push({
        questionId: assignedId,
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

    const computedEntryLevel = this.computeEntryLevel(
      scorePercent,
      selectedLevel,
    );

    return {
      passedTestCases,
      totalTestCases,
      scorePercent,
      computedEntryLevel,
      perQuestion,
    };
  }

  async runSolution(
    questionId: string,
    code: string,
    includeHidden = false,
  ): Promise<SkillTestRunResult> {
    const problemSource = await this.getProblemSource(questionId);
    const selectedTestCases = includeHidden
      ? this.getAllTestCases(problemSource)
      : this.getPublicTestCases(problemSource);

    if (selectedTestCases.length === 0) {
      throw new BadRequestException(
        'This coding problem has no runnable test cases',
      );
    }

    const evaluation = await this.runEvaluation(
      problemSource,
      code,
      includeHidden,
    );
    const firstError = evaluation.results.find((result) => result.error)?.error;
    const status: SkillTestRunResult['status'] =
      evaluation.passedCount === selectedTestCases.length
        ? 'Accepted'
        : firstError?.includes('Time limit exceeded')
          ? 'Time Limit Exceeded'
          : firstError
            ? 'Runtime Error'
            : 'Wrong Answer';

    return {
      questionId,
      status,
      passedCount: evaluation.passedCount,
      total: selectedTestCases.length,
      notes:
        status === 'Accepted'
          ? `Passed ${evaluation.passedCount}/${selectedTestCases.length} ${
              includeHidden ? 'full' : 'sample'
            } checks.`
          : `Passed ${evaluation.passedCount}/${selectedTestCases.length} ${
              includeHidden ? 'full' : 'sample'
            } checks. Review the failing case(s) below.`,
      errorMessage: firstError,
      cases: selectedTestCases.map((testCase, index) => {
        const result = evaluation.results[index];
        return {
          index,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: result?.actualOutput,
          passed: result?.passed ?? false,
          errorMessage: result?.error,
          isHidden: !!testCase.isHidden,
        };
      }),
    };
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
      track:
        q.field === CareerField.BACKEND
          ? CareerField.BACKEND
          : CareerField.FRONTEND,
      targetSkillLevel: this.inferSkillLevelFromDifficulty(q.difficulty),
      language: 'javascript',
      starterCode: jsTemplate?.starterCode || DEFAULT_STARTER_CODE,
      timeLimitSeconds: q.timeLimitSeconds ?? 300,
      estimatedMinutes: Math.max(
        5,
        Math.round((q.timeLimitSeconds ?? 300) / 60),
      ),
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

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private pickFallbackProblems(
    field: CareerField,
    selectedLevel: SkillLevel,
    size: number,
    excludeIds: string[] = [],
  ): SurveyCodingProblemDefinition[] {
    if (size <= 0) return [];

    const excludeIdSet = new Set(excludeIds);
    const pool = SURVEY_PROBLEM_BANK.filter(
      (problem) =>
        !excludeIdSet.has(problem._id.toString()) &&
        (field === CareerField.FULLSTACK || problem.field === field),
    );

    // Group by level distance
    const groups: Record<number, SurveyCodingProblemDefinition[]> = {};
    for (const problem of pool) {
      const dist = this.getLevelDistance(problem.targetSkillLevel, selectedLevel);
      if (!groups[dist]) {
        groups[dist] = [];
      }
      groups[dist].push(problem);
    }

    // Sort distance keys ascending
    const dists = Object.keys(groups)
      .map(Number)
      .sort((a, b) => a - b);

    // Shuffle within each distance group
    const orderedCandidates: SurveyCodingProblemDefinition[] = [];
    for (const dist of dists) {
      const shuffledGroup = this.shuffle(groups[dist]);
      orderedCandidates.push(...shuffledGroup);
    }

    if (field !== CareerField.FULLSTACK) {
      return orderedCandidates.slice(0, size);
    }

    // For fullstack, we still want a mix of frontend and backend
    const frontendQueue = orderedCandidates.filter(
      (problem) => problem.field === CareerField.FRONTEND,
    );
    const backendQueue = orderedCandidates.filter(
      (problem) => problem.field === CareerField.BACKEND,
    );

    const picked: SurveyCodingProblemDefinition[] = [];
    while (
      picked.length < size &&
      (frontendQueue.length > 0 || backendQueue.length > 0)
    ) {
      if (frontendQueue.length > 0) {
        picked.push(frontendQueue.shift()!);
      }
      if (picked.length >= size) break;
      if (backendQueue.length > 0) {
        picked.push(backendQueue.shift()!);
      }
    }

    return picked.slice(0, size);
  }

  private toPublicFallbackProblem(
    problem: SurveyCodingProblemDefinition,
  ): CodingProblem {
    return {
      _id: problem._id,
      title: problem.title,
      content: problem.content,
      difficulty: problem.difficulty,
      track: problem.field,
      targetSkillLevel: problem.targetSkillLevel,
      language: 'javascript',
      starterCode: problem.starterCode || DEFAULT_STARTER_CODE,
      timeLimitSeconds: problem.timeLimitSeconds,
      estimatedMinutes: Math.max(5, Math.round(problem.timeLimitSeconds / 60)),
      sampleTestCases: problem.testCases
        .filter((testCase) => !testCase.isHidden)
        .map((testCase) => ({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          explanation: testCase.explanation,
        })),
      totalTestCases: problem.testCases.length,
    };
  }

  private resolveRequestedProblemCount(
    level: SkillLevel,
    requestedCount?: number,
  ) {
    const desired = requestedCount ?? DEFAULT_PROBLEM_COUNT_BY_LEVEL[level];
    return Math.min(Math.max(desired, 1), MAX_PROBLEMS);
  }

  /**
   * Placement rule for survey → learning path:
   * - Beginner-targeted tests stay at Beginner.
   * - Intermediate-targeted tests:
   *   - exactly 50% or below -> Beginner
   *   - above 50% -> Intermediate
   * - Advanced-targeted tests:
   *   - 50% or above -> Advanced
   *   - below 50% -> Intermediate
   */
  computeEntryLevel(
    scorePercent: number,
    selectedLevel?: SkillLevel,
  ): LessonLevel {
    const normalizedScore = Math.max(0, Math.min(scorePercent, 100));
    const selectedBand = this.mapSkillLevelToLessonLevel(selectedLevel);

    if (selectedBand === LessonLevel.ADVANCED) {
      return normalizedScore >= 50
        ? LessonLevel.ADVANCED
        : LessonLevel.INTERMEDIATE;
    }

    if (selectedBand === LessonLevel.INTERMEDIATE) {
      return normalizedScore > 50
        ? LessonLevel.INTERMEDIATE
        : LessonLevel.ROOT;
    }

    return LessonLevel.ROOT;
  }

  private getLevelDistance(a: SkillLevel, b: SkillLevel) {
    return Math.abs(LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));
  }

  private mapSkillLevelToLessonLevel(level?: SkillLevel): LessonLevel {
    if (level === SkillLevel.MASTER) return LessonLevel.ADVANCED;
    if (level === SkillLevel.JOURNEYMAN) return LessonLevel.INTERMEDIATE;
    return LessonLevel.ROOT;
  }

  private inferSkillLevelFromDifficulty(difficulty?: string): SkillLevel {
    if (difficulty === 'hard') return SkillLevel.MASTER;
    if (difficulty === 'medium') return SkillLevel.JOURNEYMAN;
    return SkillLevel.APPRENTICE;
  }

  private async getProblemSource(questionId: string) {
    const fallbackProblem = SURVEY_PROBLEM_BANK.find(
      (problem) => problem._id.toString() === questionId,
    );
    if (fallbackProblem) {
      return { type: 'fallback' as const, problem: fallbackProblem };
    }

    if (Types.ObjectId.isValid(questionId)) {
      const dbQuestion = await this.questionModel.findById(questionId);
      if (dbQuestion) {
        return { type: 'db' as const, problem: dbQuestion };
      }
    }

    throw new BadRequestException(`Question ${questionId} was not found`);
  }

  private getPublicTestCases(problemSource: {
    type: 'fallback' | 'db';
    problem: SurveyCodingProblemDefinition | QuestionDocument;
  }) {
    return this.getAllTestCases(problemSource).filter(
      (testCase) => !testCase.isHidden,
    );
  }

  private getAllTestCases(problemSource: {
    type: 'fallback' | 'db';
    problem: SurveyCodingProblemDefinition | QuestionDocument;
  }) {
    if (problemSource.type === 'fallback') {
      return problemSource.problem.testCases;
    }

    return problemSource.problem.testCases.map((testCase) => ({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      explanation: testCase.explanation,
      isHidden: !!testCase.isHidden,
    }));
  }

  private async runEvaluation(
    problemSource: {
      type: 'fallback' | 'db';
      problem: SurveyCodingProblemDefinition | QuestionDocument;
    },
    code: string,
    includeHidden: boolean,
  ) {
    const testCases = includeHidden
      ? this.getAllTestCases(problemSource)
      : this.getPublicTestCases(problemSource);

    return this.codeRunner.evaluate(
      code,
      testCases.map((testCase) => ({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
      })),
    );
  }
}
