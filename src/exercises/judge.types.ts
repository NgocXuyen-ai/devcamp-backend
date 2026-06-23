export type SubmissionStatusLabel =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Compilation Error'
  | 'Runtime Error'
  | 'Time Limit Exceeded';

export type JudgeCaseResult = {
  id: string;
  title: string;
  input: string;
  expected: string;
  passed: boolean;
  detail: string;
};

export type JudgeRunResult = {
  status: SubmissionStatusLabel;
  passedCount: number;
  total: number;
  runtime: string;
  memory: string;
  notes: string;
  cases: JudgeCaseResult[];
};

export type EvaluationMode = 'sample' | 'full';
