export interface ExecutionResult {
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  statusId: number;
  statusDescription: string;
  time: string | null;
  memory: number | null;
}
