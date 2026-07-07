import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';

export interface RunnableTestCase {
  input: string;
  expectedOutput: string;
}

export interface TestCaseRunResult {
  passed: boolean;
  actualOutput?: string;
  error?: string;
  timedOut: boolean;
}

export interface EvaluationResult {
  passedCount: number;
  totalCount: number;
  results: TestCaseRunResult[];
  /** First error encountered (syntax/runtime/timeout), if any */
  error?: string;
}

/** Per-testcase execution timeout */
const RUN_TIMEOUT_MS = 3000;
const MAX_OUTPUT_BYTES = 1024 * 1024;
const MAX_ERROR_LENGTH = 500;

/**
 * CodeRunnerService — lightweight JS function runner for the survey
 * skill test. No queue, no container: each test case runs the user's
 * code in a short-lived child Node process (killed on timeout) and the
 * stdout is compared against the expected output.
 *
 * Convention: user code must define a function named `solve`.
 *   - Test case `input` is parsed as JSON; an array becomes the argument
 *     list (`solve(...args)`), anything else is passed as a single arg.
 *   - The return value (or captured console.log output when the function
 *     returns undefined) is compared with `expectedOutput`, both
 *     normalized through JSON when possible.
 */
@Injectable()
export class CodeRunnerService {
  private readonly logger = new Logger(CodeRunnerService.name);

  async evaluate(
    code: string,
    testCases: RunnableTestCase[],
    timeoutMs = RUN_TIMEOUT_MS,
  ): Promise<EvaluationResult> {
    const results: TestCaseRunResult[] = [];
    for (const tc of testCases) {
      const result = await this.runTestCase(code, tc, timeoutMs);
      results.push(result);
      // A setup error (syntax error / missing solve) fails identically on
      // every test case — no point re-spawning processes for the rest.
      if (
        result.error &&
        /SyntaxError|must define a function/.test(result.error)
      ) {
        while (results.length < testCases.length) {
          results.push({ ...result });
        }
        break;
      }
    }
    const passedCount = results.filter((r) => r.passed).length;
    return {
      passedCount,
      totalCount: testCases.length,
      results,
      error: results.find((r) => r.error)?.error,
    };
  }

  async runTestCase(
    code: string,
    testCase: RunnableTestCase,
    timeoutMs = RUN_TIMEOUT_MS,
  ): Promise<TestCaseRunResult> {
    const harness = this.buildHarness(code, testCase.input);
    const { stdout, stderr, failed, timedOut } = await this.execNode(
      harness,
      timeoutMs,
    );

    if (timedOut) {
      return {
        passed: false,
        timedOut: true,
        error: `Time limit exceeded (${timeoutMs}ms)`,
      };
    }
    if (failed) {
      return {
        passed: false,
        timedOut: false,
        error: this.firstLines(stderr) || 'Runtime error',
      };
    }
    const passed = this.outputsMatch(stdout, testCase.expectedOutput);
    return { passed, timedOut: false, actualOutput: stdout.trim() };
  }

  /**
   * Wraps user code so the child process:
   *  1. compiles the user's `solve` inside a fresh `vm` context that has
   *     NO access to `require`, `process`, `fs`, `Buffer`, or the outer
   *     `global` — only standard built-ins (Object, Array, JSON, Math,
   *     Promise, ...) that `vm.createContext` seeds by default. This is
   *     the piece that actually stops submitted code from touching the
   *     filesystem, spawning processes, or making network calls; running
   *     it as a plain child process alone did NOT provide that isolation
   *     (`require`/`process` are otherwise available to any Node script,
   *     which is what `new Function(...)` was giving the user's code).
   *  2. runs the compiled script with a synchronous `timeout` (belt and
   *     suspenders on top of the outer execFile timeout — this one also
   *     catches tight synchronous infinite loops inside `vm`),
   *  3. calls the extracted `solve` with the parsed test-case input
   *     (await: async solve OK),
   *  4. prints the result on stdout.
   * User code and input are embedded via JSON.stringify — no injection.
   *
   * Caveat (documented, not silently assumed away): `vm` isolates
   * globals but does NOT provide OS-level memory/CPU limits — a
   * pathological allocation loop can still pressure the host process.
   * For stronger isolation (hard memory caps, true process-level
   * sandboxing) consider running each execution in its own throwaway
   * container (gVisor/Firecracker) or a dedicated isolate library such
   * as `isolated-vm`.
   */
  private buildHarness(code: string, input: string): string {
    return `
'use strict';
const vm = require('vm');

let __captured = '';
const __sandbox = {
  console: {
    log: (...args) => {
      __captured +=
        args
          .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
          .join(' ') + '\\n';
    },
  },
};
vm.createContext(__sandbox);

(async () => {
  const __script = new vm.Script(
    ${JSON.stringify(code)} +
      '\\n;typeof solve === "function" ? solve : undefined;',
  );

  const solve = __script.runInContext(__sandbox, { timeout: ${RUN_TIMEOUT_MS} });
  if (typeof solve !== 'function') {
    throw new Error('Your code must define a function named "solve"');
  }

  const __raw = ${JSON.stringify(input)};
  let __args;
  try {
    const __parsed = JSON.parse(__raw);
    __args = Array.isArray(__parsed) ? __parsed : [__parsed];
  } catch {
    __args = [__raw];
  }

  const __result = await solve(...__args);
  console.log(
    __result === undefined
      ? __captured.trimEnd()
      : typeof __result === 'string'
        ? __result
        : JSON.stringify(__result),
  );
})().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
`;
  }

  private execNode(
    harness: string,
    timeoutMs: number,
  ): Promise<{
    stdout: string;
    stderr: string;
    failed: boolean;
    timedOut: boolean;
  }> {
    // Minimal env so user code cannot read server secrets; SystemRoot is
    // required for Node to boot on Windows.
    const env: NodeJS.ProcessEnv = {};
    if (process.platform === 'win32' && process.env.SystemRoot) {
      env.SystemRoot = process.env.SystemRoot;
    }
    return new Promise((resolve) => {
      execFile(
        process.execPath,
        ['--no-warnings', '-e', harness],
        {
          timeout: timeoutMs,
          maxBuffer: MAX_OUTPUT_BYTES,
          windowsHide: true,
          env,
        },
        (error, stdout, stderr) => {
          const timedOut =
            !!error && (error.killed || error.signal === 'SIGTERM');
          if (error && !timedOut && !stderr) {
            this.logger.warn(`Code runner failed: ${error.message}`);
          }
          resolve({ stdout, stderr, failed: !!error, timedOut });
        },
      );
    });
  }

  /** Normalize both sides through JSON when possible, else trim-compare. */
  private outputsMatch(actual: string, expected: string): boolean {
    const normalize = (s: string): string => {
      const trimmed = s.trim();
      try {
        return JSON.stringify(JSON.parse(trimmed));
      } catch {
        return trimmed;
      }
    };
    return normalize(actual) === normalize(expected);
  }

  private firstLines(stderr: string): string {
    return stderr
      .trim()
      .split('\n')
      .slice(0, 3)
      .join('\n')
      .slice(0, MAX_ERROR_LENGTH);
  }
}
