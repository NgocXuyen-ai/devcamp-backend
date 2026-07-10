import { Injectable, Logger } from '@nestjs/common';
import { CodeExecutionService } from './code-execution.service';
import { LANGUAGE_IDS } from './constants/language-ids';

import type {
  JudgeResult,
  TestCaseResult,
} from './interfaces/judge-result.interface';

interface TestCaseInput {
  input: string;
  expectedOutput: string;
}

@Injectable()
export class CodeJudgeService {
  private readonly logger = new Logger(CodeJudgeService.name);

  constructor(private readonly executionService: CodeExecutionService) {}

  async judgeCode(
    userCode: string,
    functionName: string,
    testCases: TestCaseInput[],
    language: string = 'javascript',
  ): Promise<JudgeResult> {
    const languageId = LANGUAGE_IDS[language];
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const testResults: TestCaseResult[] = [];

    for (const testCase of testCases) {
      const wrappedCode = this.wrapCode(
        userCode,
        functionName,
        testCase.input,
        language,
      );

      this.logger.debug(`Running test: ${functionName}(${testCase.input})`);

      try {
        const result = await this.executionService.execute(
          wrappedCode,
          languageId,
        );

        // statusId 3 = Accepted (chạy xong, không lỗi)
        if (result.statusId !== 3) {
          testResults.push({
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: null,
            passed: false,
            error:
              result.compileOutput || result.stderr || result.statusDescription,
          });
          continue;
        }

        const actual = (result.stdout ?? '').trim();
        const expected = testCase.expectedOutput.trim();
        const passed = actual === expected;

        testResults.push({
          input: testCase.input,
          expectedOutput: expected,
          actualOutput: actual,
          passed,
          error: null,
        });
      } catch (error) {
        testResults.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: null,
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const passedTests = testResults.filter((t) => t.passed).length;

    return {
      isCorrect: passedTests === testCases.length,
      totalTests: testCases.length,
      passedTests,
      testResults,
    };
  }

  private wrapCode(
    userCode: string,
    functionName: string,
    input: string,
    language: string,
  ): string {
    // input trong DB là dạng string: "[1, 2]" hoặc "5"
    // Cần parse ra args để gọi function
    let args: string;
    try {
      const parsed = JSON.parse(input) as unknown;
      // Nếu input là array → spread thành args: add(1, 2)
      // Nếu input là giá trị đơn → truyền thẳng: factorial(5)
      args = Array.isArray(parsed)
        ? parsed.map((a) => JSON.stringify(a)).join(', ')
        : JSON.stringify(parsed);
    } catch {
      // Input không phải JSON → truyền nguyên dạng string
      args = `"${input}"`;
    }

    if (language === 'javascript' || language === 'typescript') {
      return `${userCode}\nconsole.log(${functionName}(${args}));`;
    }

    if (language === 'python') {
      return `${userCode}\nprint(${functionName}(${args}))`;
    }

    if (language === 'java') {
      return `${userCode}\nSystem.out.println(${functionName}(${args}));`;
    }

    return `${userCode}\nconsole.log(${functionName}(${args}));`;
  }
  extractFunctionName(starterCode: string): string {
    // Match: function name(...) hoặc const name = (...) =>
    const match = starterCode.match(
      /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/,
    );
    if (match) return match[1];

    const arrowMatch = starterCode.match(
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/,
    );
    if (arrowMatch) return arrowMatch[1];

    throw new Error('Cannot extract function name from starterCode');
  }
}
