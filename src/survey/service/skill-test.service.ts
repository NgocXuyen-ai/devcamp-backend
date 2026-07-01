import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CareerField, LessonLevel, SkillLevel } from '../../common/enums';
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

const MAX_PROBLEMS = 3;
const DEFAULT_PROBLEM_COUNT_BY_LEVEL: Record<SkillLevel, number> = {
  [SkillLevel.NOVICE]: 1,
  [SkillLevel.APPRENTICE]: 2,
  [SkillLevel.JOURNEYMAN]: 3,
  [SkillLevel.MASTER]: 3,
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

type SurveyCodingProblemDefinition = {
  _id: Types.ObjectId;
  field: CareerField.FRONTEND | CareerField.BACKEND;
  targetSkillLevel: SkillLevel;
  title: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  starterCode: string;
  timeLimitSeconds: number;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    explanation?: string;
    isHidden?: boolean;
  }>;
};

const SURVEY_PROBLEM_BANK: SurveyCodingProblemDefinition[] = [
  {
    _id: new Types.ObjectId('66f000000000000000000101'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Normalize Button Labels',
    content:
      'Viết `solve(labels)` nhận vào một mảng string và trả về một mảng mới.\n\nYêu cầu:\n- trim khoảng trắng đầu/cuối\n- bỏ phần tử rỗng sau khi trim\n- chuyển toàn bộ label sang lowercase\n- giữ nguyên thứ tự phần tử hợp lệ',
    starterCode: `function solve(labels) {
  if (!Array.isArray(labels)) return [];

  return labels;
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '["  Save  "," Cancel ","   "]',
        expectedOutput: '["save","cancel"]',
        explanation: 'Loại bỏ khoảng trắng và phần tử rỗng.',
      },
      {
        input: '[" Sign Up ","Login"]',
        expectedOutput: '["sign up","login"]',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000102'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Build Filter Summary',
    content:
      'Viết `solve(filters)` nhận vào object filter và trả về object summary.\n\nInput ví dụ:\n`{ search: " react ", tags: ["ui", "", "hooks"], page: 3 }`\n\nOutput mong muốn:\n`{ query: "react", activeTagCount: 2, page: 3, hasActiveFilters: true }`\n\nQuy tắc:\n- `query` = chuỗi search sau khi trim\n- `activeTagCount` = số tag không rỗng\n- `page` = số page hợp lệ, mặc định 1 nếu thiếu hoặc <= 0\n- `hasActiveFilters` = true nếu có query hoặc có ít nhất 1 tag hợp lệ',
    starterCode: `function solve(filters) {
  const source = filters ?? {};

  return {
    query: "",
    activeTagCount: 0,
    page: 1,
    hasActiveFilters: false,
  };
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input: '[{"search":" react ","tags":["ui","","hooks"],"page":3}]',
        expectedOutput:
          '{"query":"react","activeTagCount":2,"page":3,"hasActiveFilters":true}',
        explanation: 'Có search, có 2 tag hợp lệ và page = 3.',
      },
      {
        input: '[{"search":"   ","tags":["",""],"page":0}]',
        expectedOutput:
          '{"query":"","activeTagCount":0,"page":1,"hasActiveFilters":false}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000103'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Compose Lesson Progress Snapshot',
    content:
      'Viết `solve(lessons)` nhận vào mảng lesson có dạng `{ id, status, durationMinutes }`.\n\nTrả về object `{ totalLessons, completedLessons, inProgressLessons, totalMinutes, completionRate }`.\n\nQuy tắc:\n- `completedLessons` = số lesson có `status === "completed"`\n- `inProgressLessons` = số lesson có `status === "in_progress"`\n- `totalMinutes` = tổng `durationMinutes` hợp lệ (> 0)\n- `completionRate` = làm tròn phần trăm hoàn thành từ 0 đến 100',
    starterCode: `function solve(lessons) {
  const items = Array.isArray(lessons) ? lessons : [];

  return {
    totalLessons: 0,
    completedLessons: 0,
    inProgressLessons: 0,
    totalMinutes: 0,
    completionRate: 0,
  };
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input:
          '[[{"id":"l1","status":"completed","durationMinutes":20},{"id":"l2","status":"in_progress","durationMinutes":15},{"id":"l3","status":"completed","durationMinutes":25}]]',
        expectedOutput:
          '{"totalLessons":3,"completedLessons":2,"inProgressLessons":1,"totalMinutes":60,"completionRate":67}',
        explanation:
          'Tính đủ số lượng lesson, tổng thời gian và phần trăm hoàn thành.',
      },
      {
        input:
          '[[{"id":"l1","status":"todo","durationMinutes":0},{"id":"l2","status":"completed","durationMinutes":10}]]',
        expectedOutput:
          '{"totalLessons":2,"completedLessons":1,"inProgressLessons":0,"totalMinutes":10,"completionRate":50}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000104'),
    field: CareerField.FRONTEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'Merge Notification Feed',
    content:
      'Viết `solve(currentItems, incomingItems)` để merge hai mảng notification.\n\nMỗi item có dạng `{ id, createdAt, read }`.\n\nYêu cầu:\n- giữ item duy nhất theo `id`\n- nếu cùng `id`, ưu tiên item từ `incomingItems`\n- sort giảm dần theo `createdAt`\n- trả về object `{ items, unreadCount }`',
    starterCode: `function solve(currentItems, incomingItems) {
  const current = Array.isArray(currentItems) ? currentItems : [];
  const incoming = Array.isArray(incomingItems) ? incomingItems : [];

  return {
    items: current,
    unreadCount: 0,
  };
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input:
          '[[{"id":"n1","createdAt":1,"read":true},{"id":"n2","createdAt":3,"read":false}],[{"id":"n2","createdAt":4,"read":false},{"id":"n3","createdAt":2,"read":true}]]',
        expectedOutput:
          '{"items":[{"id":"n2","createdAt":4,"read":false},{"id":"n3","createdAt":2,"read":true},{"id":"n1","createdAt":1,"read":true}],"unreadCount":1}',
        explanation:
          'Item n2 từ incoming ghi đè item cũ và danh sách được sort giảm dần.',
      },
      {
        input: '[[],[{"id":"n1","createdAt":10,"read":false}]]',
        expectedOutput:
          '{"items":[{"id":"n1","createdAt":10,"read":false}],"unreadCount":1}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000201'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.NOVICE,
    difficulty: 'easy',
    title: 'Normalize Query Params',
    content:
      'Viết `solve(query)` nhận vào object query params và trả về object chuẩn hóa.\n\nYêu cầu:\n- `page` và `limit` phải là số nguyên dương, mặc định `page = 1`, `limit = 20`\n- `search` là string đã trim\n- output: `{ page, limit, search }`',
    starterCode: `function solve(query) {
  const source = query ?? {};

  return {
    page: 1,
    limit: 20,
    search: "",
  };
}
`,
    timeLimitSeconds: 240,
    testCases: [
      {
        input: '[{"page":"2","limit":"5","search":" api "}]',
        expectedOutput: '{"page":2,"limit":5,"search":"api"}',
        explanation: 'Query hợp lệ được parse sang kiểu đúng.',
      },
      {
        input: '[{"page":"0","limit":"-1","search":"   "}]',
        expectedOutput: '{"page":1,"limit":20,"search":""}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000202'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.APPRENTICE,
    difficulty: 'medium',
    title: 'Build API Response Envelope',
    content:
      'Viết `solve(input)` nhận vào object `{ ok, data, error, traceId }` và trả về response envelope chuẩn.\n\nQuy tắc:\n- nếu `ok === true` => `{ status: 200, body: { data, error: null, traceId } }`\n- nếu `ok === false` => `{ status: 400, body: { data: null, error, traceId } }`\n- nếu thiếu `traceId` thì dùng `"generated-trace"`',
    starterCode: `function solve(input) {
  const source = input ?? {};

  return {
    status: 200,
    body: {
      data: null,
      error: null,
      traceId: "generated-trace",
    },
  };
}
`,
    timeLimitSeconds: 300,
    testCases: [
      {
        input:
          '[{"ok":true,"data":{"id":"u1"},"error":null,"traceId":"abc-123"}]',
        expectedOutput:
          '{"status":200,"body":{"data":{"id":"u1"},"error":null,"traceId":"abc-123"}}',
        explanation: 'Nhánh success giữ nguyên data và traceId.',
      },
      {
        input: '[{"ok":false,"error":"invalid payload"}]',
        expectedOutput:
          '{"status":400,"body":{"data":null,"error":"invalid payload","traceId":"generated-trace"}}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000203'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.JOURNEYMAN,
    difficulty: 'medium',
    title: 'Aggregate API Metrics',
    content:
      'Viết `solve(requests)` nhận vào mảng request `{ path, durationMs, statusCode }`.\n\nTrả về object `{ totalRequests, averageDurationMs, errorCount, slowestPath }`.\n\nQuy tắc:\n- `averageDurationMs` = làm tròn số trung bình duration\n- `errorCount` = số request có `statusCode >= 400`\n- `slowestPath` = `path` của request có `durationMs` lớn nhất; nếu rỗng thì `""`',
    starterCode: `function solve(requests) {
  const items = Array.isArray(requests) ? requests : [];

  return {
    totalRequests: 0,
    averageDurationMs: 0,
    errorCount: 0,
    slowestPath: "",
  };
}
`,
    timeLimitSeconds: 330,
    testCases: [
      {
        input:
          '[[{"path":"/users","durationMs":120,"statusCode":200},{"path":"/orders","durationMs":300,"statusCode":500},{"path":"/health","durationMs":50,"statusCode":200}]]',
        expectedOutput:
          '{"totalRequests":3,"averageDurationMs":157,"errorCount":1,"slowestPath":"/orders"}',
        explanation: 'Tính trung bình duration, số lỗi và endpoint chậm nhất.',
      },
      {
        input: '[[]]',
        expectedOutput:
          '{"totalRequests":0,"averageDurationMs":0,"errorCount":0,"slowestPath":""}',
        isHidden: true,
      },
    ],
  },
  {
    _id: new Types.ObjectId('66f000000000000000000204'),
    field: CareerField.BACKEND,
    targetSkillLevel: SkillLevel.MASTER,
    difficulty: 'hard',
    title: 'Group Job Retries',
    content:
      'Viết `solve(jobs)` nhận vào mảng job `{ id, queue, attempts, maxAttempts }`.\n\nTrả về object:\n- `ready`: danh sách `id` có thể retry tiếp (`attempts < maxAttempts`)\n- `deadLetter`: danh sách `id` đã vượt quota retry\n- `summaryByQueue`: object đếm tổng số job theo từng queue',
    starterCode: `function solve(jobs) {
  const items = Array.isArray(jobs) ? jobs : [];

  return {
    ready: [],
    deadLetter: [],
    summaryByQueue: {},
  };
}
`,
    timeLimitSeconds: 360,
    testCases: [
      {
        input:
          '[[{"id":"j1","queue":"email","attempts":1,"maxAttempts":3},{"id":"j2","queue":"email","attempts":3,"maxAttempts":3},{"id":"j3","queue":"sync","attempts":0,"maxAttempts":2}]]',
        expectedOutput:
          '{"ready":["j1","j3"],"deadLetter":["j2"],"summaryByQueue":{"email":2,"sync":1}}',
        explanation: 'Phân loại retry và tổng hợp theo queue.',
      },
      {
        input: '[[]]',
        expectedOutput: '{"ready":[],"deadLetter":[],"summaryByQueue":{}}',
        isHidden: true,
      },
    ],
  },
];

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

  /**
   * Grade the submitted solutions against the question test cases (JS
   * only, no AI). Assigned questions left unsubmitted count as 0 passed.
   * Score = (passed test cases / total test cases) * 100.
   */
  async grade(
    assignedQuestionIds: Types.ObjectId[],
    solutions: CodeSolution[],
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

    const rankCandidates = (items: SurveyCodingProblemDefinition[]) =>
      items.slice().sort((a, b) => {
        const distanceDiff =
          this.getLevelDistance(a.targetSkillLevel, selectedLevel) -
          this.getLevelDistance(b.targetSkillLevel, selectedLevel);
        if (distanceDiff !== 0) return distanceDiff;

        const levelOrderDiff =
          LEVEL_ORDER.indexOf(a.targetSkillLevel) -
          LEVEL_ORDER.indexOf(b.targetSkillLevel);
        if (levelOrderDiff !== 0) return levelOrderDiff;

        const difficultyRank = { easy: 1, medium: 2, hard: 3 };
        const difficultyDiff =
          difficultyRank[a.difficulty] - difficultyRank[b.difficulty];
        if (difficultyDiff !== 0) return difficultyDiff;

        return a.title.localeCompare(b.title);
      });

    if (field !== CareerField.FULLSTACK) {
      return rankCandidates(pool).slice(0, size);
    }

    const frontendQueue = rankCandidates(
      pool.filter((problem) => problem.field === CareerField.FRONTEND),
    );
    const backendQueue = rankCandidates(
      pool.filter((problem) => problem.field === CareerField.BACKEND),
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

  private getLevelDistance(a: SkillLevel, b: SkillLevel) {
    return Math.abs(LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));
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
