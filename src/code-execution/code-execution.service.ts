import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ExecutionResult } from './interfaces/execution-result.interface';

interface Judge0Response {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: { id: number; description: string };
  time: string | null;
  memory: number | null;
}

@Injectable()
export class CodeExecutionService {
  private readonly logger = new Logger(CodeExecutionService.name);
  private readonly apiUrl: string;
  private readonly authToken: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>(
      'JUDGE0_API_URL',
      'http://localhost:2358',
    );
    this.authToken = this.configService.get<string>('JUDGE0_AUTHN_TOKEN', '');
  }

  async execute(
    sourceCode: string,
    languageId: number,
    stdin: string = '',
  ): Promise<ExecutionResult> {
    const url = `${this.apiUrl}/submissions?wait=true`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': this.authToken,
      },
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: languageId,
        stdin,
      }),
    });

    if (!response.ok) {
      this.logger.error(`Judge0 error: ${response.status}`);
      throw new Error(`Judge0 API error: ${response.status}`);
    }

    const data = (await response.json()) as Judge0Response;

    this.logger.debug(
      `Execution result: status=${data.status.id} (${data.status.description})`,
    );

    return {
      stdout: data.stdout?.trim() ?? null,
      stderr: data.stderr?.trim() ?? null,
      compileOutput: data.compile_output?.trim() ?? null,
      statusId: data.status.id,
      statusDescription: data.status.description,
      time: data.time,
      memory: data.memory,
    };
  }
}
