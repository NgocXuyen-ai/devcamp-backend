import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { EvaluationMode, JudgeCaseResult, JudgeRunResult } from './judge.types';

const execFileAsync = promisify(execFile);
const RESULT_PREFIX = '__CG_JUDGE__';
const EXEC_TIMEOUT_MS = 5000;

type SupportedExecutableLanguage = 'javascript' | 'python';

type HandleRequestTestCase = {
  id: string;
  title: string;
  input: string;
  expected: string;
  requestPayload: unknown;
  visibility: EvaluationMode;
};

type RunnerPayload = {
  status: 'ok' | 'compilation_error' | 'runtime_error' | 'time_limit_exceeded';
  runtimeMs?: number;
  memoryKb?: number;
  notes?: string;
  cases: JudgeCaseResult[];
};

export function supportsExecutableRunner(language: string, topic: string) {
  return (
    (language === 'javascript' || language === 'python') &&
    isBackendExecutableTopic(topic)
  );
}

export async function runExecutableEvaluation(input: {
  language: SupportedExecutableLanguage;
  code: string;
  locale?: 'vi' | 'en';
  mode: EvaluationMode;
}): Promise<JudgeRunResult | null> {
  const testCases = buildHandleRequestTestCases(input.locale, input.mode);
  try {
    const payload =
      input.language === 'javascript'
        ? await runJavaScriptHandleRequest(input.code, testCases)
        : await runPythonHandleRequest(input.code, testCases);

    return toJudgeRunResult(payload, input.locale);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'ENOENT'
    ) {
      return null;
    }

    const message =
      error instanceof Error ? error.message : 'Unknown execution error.';
    return toJudgeRunResult(
      {
        status: 'runtime_error',
        notes: message,
        cases: testCases.map((item) => ({
          id: item.id,
          title: item.title,
          input: item.input,
          expected: item.expected,
          passed: false,
          detail: message,
        })),
      },
      input.locale
    );
  }
}

function isBackendExecutableTopic(topic: string) {
  return new Set([
    'HTTP Fundamentals',
    'API Design',
    'Authentication',
    'Caching',
    'Security',
    'Node.js Runtime',
    'Observability',
    'Messaging & Queues',
    'Concurrency',
    'Testing',
  ]).has(topic);
}

function buildHandleRequestTestCases(
  locale: 'vi' | 'en' | undefined,
  mode: EvaluationMode
) {
  const isVi = locale === 'vi';
  const allCases: HandleRequestTestCase[] = [
    {
      id: 'request-shape',
      title: isVi ? 'Trả về response object' : 'Return a response object',
      input: isVi ? 'GET /health' : 'GET /health',
      expected: isVi
        ? 'Kết quả là object có `status` và `body`'
        : 'Return an object with `status` and `body`',
      requestPayload: { method: 'GET', path: '/health' },
      visibility: 'sample',
    },
    {
      id: 'request-ok',
      title: isVi ? 'Trả về HTTP 200' : 'Return HTTP 200',
      input: isVi ? 'GET /users/42' : 'GET /users/42',
      expected: isVi ? '`status === 200`' : '`status === 200`',
      requestPayload: { method: 'GET', path: '/users/42' },
      visibility: 'sample',
    },
    {
      id: 'request-resilient',
      title: isVi ? 'Xử lý input trống' : 'Handle empty input',
      input: isVi ? '`undefined` request' : '`undefined` request',
      expected: isVi
        ? 'Không throw và vẫn trả về response hợp lệ'
        : 'Do not throw and still return a valid response',
      requestPayload: undefined,
      visibility: 'full',
    },
    {
      id: 'request-body',
      title: isVi ? 'Giữ body hợp lệ' : 'Keep a valid body',
      input: isVi ? 'POST /login' : 'POST /login',
      expected: isVi
        ? '`body` không được `undefined` hoặc `null`'
        : '`body` must not be `undefined` or `null`',
      requestPayload: { method: 'POST', path: '/login', body: { user: 'demo' } },
      visibility: 'full',
    },
  ];

  return allCases.filter((item) =>
    mode === 'sample' ? item.visibility === 'sample' : true
  );
}

async function runJavaScriptHandleRequest(
  code: string,
  testCases: HandleRequestTestCase[]
) {
  const workingDir = await mkdtemp(join(tmpdir(), 'cfg-js-judge-'));
  const filePath = join(workingDir, 'judge.mjs');
  const script = `${code}

const __cgCases = ${JSON.stringify(testCases)};

async function __cgRun() {
  if (typeof handleRequest !== 'function') {
    throw new Error('Expected a function named handleRequest(req).');
  }

  const cases = [];
  let peakMemoryKb = 0;
  for (const testCase of __cgCases) {
    const startedAt = performance.now();
    let result;
    try {
      result = await Promise.resolve(handleRequest(testCase.requestPayload));
    } catch (error) {
      cases.push({
        id: testCase.id,
        title: testCase.title,
        input: testCase.input,
        expected: testCase.expected,
        passed: false,
        detail: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    const runtimeMs = Math.max(1, Math.round(performance.now() - startedAt));
    const memoryKb = Math.round(process.memoryUsage().rss / 1024);
    peakMemoryKb = Math.max(peakMemoryKb, memoryKb);
    const hasObject = typeof result === 'object' && result !== null;
    const hasStatus = hasObject && typeof result.status === 'number';
    const hasBody = hasObject && Object.prototype.hasOwnProperty.call(result, 'body');
    const statusOk = hasStatus && result.status === 200;
    const bodyOk = hasBody && result.body !== undefined && result.body !== null;
    const passed = hasObject && hasStatus && hasBody && statusOk && bodyOk;

    cases.push({
      id: testCase.id,
      title: testCase.title,
      input: testCase.input,
      expected: testCase.expected,
      passed,
      detail: passed
        ? \`OK in \${runtimeMs} ms\`
        : !hasObject
          ? 'Expected an object response.'
          : !hasStatus
            ? 'Expected a numeric status field.'
            : !hasBody
              ? 'Expected a body field.'
              : !statusOk
                ? \`Expected status 200 but received \${String(result.status)}.\`
                : 'Body must not be empty.',
    });
  }

  const failedCount = cases.filter((item) => !item.passed).length;
  const runtimeMs = cases.length === 0 ? 0 : Math.max(...cases.map((item) => {
    const match = item.detail.match(/(\\d+) ms/);
    return match ? Number(match[1]) : 0;
  }));

  return {
    status: failedCount === 0 ? 'ok' : 'runtime_error',
    runtimeMs,
    memoryKb: peakMemoryKb || undefined,
    cases,
  };
}

try {
  const result = await __cgRun();
  console.log('${RESULT_PREFIX}' + JSON.stringify(result));
} catch (error) {
  console.log('${RESULT_PREFIX}' + JSON.stringify({
    status: 'runtime_error',
    notes: error instanceof Error ? error.message : String(error),
    cases: __cgCases.map((testCase) => ({
      id: testCase.id,
      title: testCase.title,
      input: testCase.input,
      expected: testCase.expected,
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    })),
  }));
}
`;

  await writeFile(filePath, script, 'utf8');

  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [filePath], {
      cwd: workingDir,
      timeout: EXEC_TIMEOUT_MS,
      windowsHide: true,
    });

    return parseRunnerPayload(`${stdout}\n${stderr}`);
  } catch (error) {
    return normalizeExecutionError(error, testCases);
  } finally {
    await rm(workingDir, { recursive: true, force: true });
  }
}

async function runPythonHandleRequest(
  code: string,
  testCases: HandleRequestTestCase[]
) {
  const workingDir = await mkdtemp(join(tmpdir(), 'cfg-py-judge-'));
  const filePath = join(workingDir, 'judge.py');
  const script = `${code}

import json
import time
import tracemalloc

__cg_cases = ${JSON.stringify(testCases)}

def __cg_pick_handler():
    if 'handle_request' in globals() and callable(globals()['handle_request']):
        return globals()['handle_request']
    if 'handleRequest' in globals() and callable(globals()['handleRequest']):
        return globals()['handleRequest']
    raise RuntimeError('Expected a function named handle_request(req) or handleRequest(req).')

def __cg_run():
    handler = __cg_pick_handler()
    tracemalloc.start()
    cases = []
    peak_kb = 0
    runtime_ms = 0

    for test_case in __cg_cases:
        started_at = time.perf_counter()
        try:
            result = handler(test_case['requestPayload'])
        except Exception as error:
            cases.append({
                'id': test_case['id'],
                'title': test_case['title'],
                'input': test_case['input'],
                'expected': test_case['expected'],
                'passed': False,
                'detail': str(error),
            })
            continue

        current_bytes, peak_bytes = tracemalloc.get_traced_memory()
        peak_kb = max(peak_kb, round(peak_bytes / 1024))
        runtime_ms = max(runtime_ms, max(1, round((time.perf_counter() - started_at) * 1000)))
        has_object = isinstance(result, dict)
        has_status = has_object and isinstance(result.get('status'), int)
        has_body = has_object and 'body' in result
        status_ok = has_status and result.get('status') == 200
        body_ok = has_body and result.get('body') is not None
        passed = has_object and has_status and has_body and status_ok and body_ok

        if passed:
            detail = f'OK in {runtime_ms} ms'
        elif not has_object:
            detail = 'Expected a dict response.'
        elif not has_status:
            detail = 'Expected an integer status field.'
        elif not has_body:
            detail = 'Expected a body field.'
        elif not status_ok:
            detail = f"Expected status 200 but received {result.get('status')!r}."
        else:
            detail = 'Body must not be empty.'

        cases.append({
            'id': test_case['id'],
            'title': test_case['title'],
            'input': test_case['input'],
            'expected': test_case['expected'],
            'passed': passed,
            'detail': detail,
        })

    tracemalloc.stop()
    failed_count = len([item for item in cases if not item['passed']])
    return {
        'status': 'ok' if failed_count == 0 else 'runtime_error',
        'runtimeMs': runtime_ms,
        'memoryKb': peak_kb or None,
        'cases': cases,
    }

try:
    result = __cg_run()
except Exception as error:
    result = {
        'status': 'runtime_error',
        'notes': str(error),
        'cases': [{
            'id': test_case['id'],
            'title': test_case['title'],
            'input': test_case['input'],
            'expected': test_case['expected'],
            'passed': False,
            'detail': str(error),
        } for test_case in __cg_cases],
    }

print('${RESULT_PREFIX}' + json.dumps(result))
`;

  await writeFile(filePath, script, 'utf8');

  try {
    const { stdout, stderr } = await execFileAsync('python', [filePath], {
      cwd: workingDir,
      timeout: EXEC_TIMEOUT_MS,
      windowsHide: true,
    });

    return parseRunnerPayload(`${stdout}\n${stderr}`);
  } catch (error) {
    return normalizeExecutionError(error, testCases);
  } finally {
    await rm(workingDir, { recursive: true, force: true });
  }
}

function parseRunnerPayload(output: string): RunnerPayload {
  const line = output
    .split(/\r?\n/)
    .reverse()
    .find((item) => item.startsWith(RESULT_PREFIX));

  if (!line) {
    throw new Error('Judge runner did not produce a parsable result.');
  }

  return JSON.parse(line.slice(RESULT_PREFIX.length)) as RunnerPayload;
}

function normalizeExecutionError(
  error: unknown,
  testCases: HandleRequestTestCase[]
): RunnerPayload {
  const stderr =
    typeof error === 'object' && error !== null && 'stderr' in error
      ? String((error as { stderr?: string }).stderr ?? '')
      : '';
  const message = stderr.trim() || (error instanceof Error ? error.message : 'Execution failed.');
  const killed =
    typeof error === 'object' && error !== null && 'killed' in error
      ? Boolean((error as { killed?: boolean }).killed)
      : false;
  const signal =
    typeof error === 'object' && error !== null && 'signal' in error
      ? String((error as { signal?: string }).signal ?? '')
      : '';
  const status = killed || signal === 'SIGTERM'
    ? 'time_limit_exceeded'
    : /SyntaxError|IndentationError|NameError: name '__future__' is not defined/i.test(message)
      ? 'compilation_error'
      : 'runtime_error';

  return {
    status,
    notes: message,
    cases: testCases.map((item) => ({
      id: item.id,
      title: item.title,
      input: item.input,
      expected: item.expected,
      passed: false,
      detail: message,
    })),
  };
}

function toJudgeRunResult(
  payload: RunnerPayload,
  locale: 'vi' | 'en' | undefined
): JudgeRunResult {
  const isVi = locale === 'vi';
  const passedCount = payload.cases.filter((item) => item.passed).length;
  const total = payload.cases.length;
  const statusMap = {
    ok: 'Accepted',
    compilation_error: 'Compilation Error',
    runtime_error:
      passedCount === total && total > 0 ? 'Accepted' : 'Wrong Answer',
    time_limit_exceeded: 'Time Limit Exceeded',
  } as const;

  const status = statusMap[payload.status];
  const runtime =
    typeof payload.runtimeMs === 'number' ? `${payload.runtimeMs} ms` : 'N/A';
  const memory =
    typeof payload.memoryKb === 'number'
      ? `${(payload.memoryKb / 1024).toFixed(1)} MB`
      : 'N/A';
  const notes =
    payload.notes ??
    (status === 'Accepted'
      ? isVi
        ? `Pass ${passedCount}/${total} test chạy thật.`
        : `Passed ${passedCount}/${total} executed tests.`
      : isVi
        ? `Pass ${passedCount}/${total} test chạy thật.`
        : `Passed ${passedCount}/${total} executed tests.`);

  return {
    status,
    passedCount,
    total,
    runtime,
    memory,
    notes,
    cases: payload.cases,
  };
}
