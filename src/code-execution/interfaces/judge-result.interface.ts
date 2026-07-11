export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string | null;
  passed: boolean;
  error: string | null;
  time: string | null;
  memory: number | null;
}

export interface JudgeResult {
  isCorrect: boolean;
  totalTests: number;
  passedTests: number;
  testResults: TestCaseResult[];
  totalMemoryKb: number;
  totalRuntimeMs: number;
}
