export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string | null;
  passed: boolean;
  error: string | null;
}

export interface JudgeResult {
  isCorrect: boolean;
  totalTests: number;
  passedTests: number;
  testResults: TestCaseResult[];
}
