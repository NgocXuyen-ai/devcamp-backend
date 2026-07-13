import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AnalysisResource } from '../schemas/code-analysis.schema';

export interface AiAnalysisResult {
  summary: string;
  strengths: string[];
  improvements: string[];
  refactoringSuggestion: string;
  resources: AnalysisResource[];
}

interface GroqChoice {
  message: { content: string };
}

interface GroqResponse {
  choices: GroqChoice[];
  usage?: { total_tokens: number };
}

@Injectable()
export class GroqAnalysisProvider {
  private readonly logger = new Logger(GroqAnalysisProvider.name);
  private readonly apiKeys: string[];
  private readonly model: string;
  private keyIndex = 0;

  constructor(private readonly configService: ConfigService) {
    const raw = this.configService.getOrThrow<string>('GROQ_API_KEYS');
    this.apiKeys = raw
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    if (this.apiKeys.length === 0) {
      throw new Error('GROQ_API_KEYS is empty');
    }
    this.model =
      this.configService.get<string>('GROQ_MODEL') || 'llama-3.1-8b-instant';
  }

  async analyze(code: string, language: string): Promise<AiAnalysisResult> {
    const prompt = this.buildPrompt(code, language);

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.getNextKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                'You are a senior code reviewer. Respond ONLY with valid JSON, no markdown fences, no extra text.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 1024,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Groq API error: ${String(response.status)} - ${errorText}`,
      );
      throw new Error(`Groq API failed: ${String(response.status)}`);
    }

    const data = (await response.json()) as GroqResponse;
    const content = data.choices?.[0]?.message?.content ?? '';

    return this.parseResponse(content, language);
  }

  private buildPrompt(code: string, language: string): string {
    return `Analyze this ${language} code and return a JSON object with exactly these keys:
{
  "summary": "1-2 sentence overview of the code quality",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "refactoringSuggestion": "function add(a, b) {\n  if (typeof a !== 'number') throw new Error('invalid');\n  return a + b;\n}"
}

Rules:
- strengths: 2-4 items, be specific about what the code does well
- improvements: 2-4 items, actionable suggestions
- refactoringSuggestion: rewrite the FULL code with your improvements applied, not just a description

Code to analyze:
\`\`\`${language}
${code}
\`\`\``;
  }

  private parseResponse(content: string, language: string): AiAnalysisResult {
    try {
      let cleaned = content
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      this.logger.log('Groq raw response: ' + cleaned.substring(0, 200));

      cleaned = cleaned.replace(
        /("(?:refactoringSuggestion)":\s*)"([\s\S]*?)"\s*(?=,\s*"|\s*})/,
        (_match, prefix: string, codeContent: string) => {
          const escaped = codeContent
            .replace(/\\/g, '\\\\')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
          return `${prefix}"${escaped}"`;
        },
      );

      const parsed = JSON.parse(cleaned) as Partial<AiAnalysisResult>;
      this.logger.log('Parsed successfully');

      const rawRefactoring: unknown =
        (parsed as Record<string, unknown>).refactoringSuggestion ?? '';
      let refactoring: string;
      if (typeof rawRefactoring === 'string') {
        refactoring = rawRefactoring;
      } else if (Array.isArray(rawRefactoring)) {
        refactoring = (rawRefactoring as string[]).join('\n');
      } else {
        refactoring = JSON.stringify(rawRefactoring, null, 2);
      }

      return {
        summary: parsed.summary || 'AI analysis completed.',
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        refactoringSuggestion: refactoring,
        resources: this.resourcesFor(language),
      };
    } catch (err) {
      this.logger.warn(`Failed to parse Groq response: ${String(err)}`);
      return this.fallback(content, language);
    }
  }

  /** Nếu AI trả về text không parse được JSON → vẫn trả kết quả hợp lý */
  private fallback(rawContent: string, language: string): AiAnalysisResult {
    return {
      summary: 'AI analysis completed (raw format).',
      strengths: ['Code produces a working solution.'],
      improvements: ['Consider adding comments and error handling.'],
      refactoringSuggestion: rawContent || 'No suggestion available.',
      resources: this.resourcesFor(language),
    };
  }

  private resourcesFor(language: string): AnalysisResource[] {
    const lang = language.toLowerCase();
    if (lang.includes('python')) {
      return [
        {
          title: 'PEP 8 – Style Guide',
          url: 'https://peps.python.org/pep-0008/',
        },
        { title: 'Big-O Cheat Sheet', url: 'https://www.bigocheatsheet.com/' },
      ];
    }
    return [
      {
        title: 'MDN – JavaScript Guide',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
      },
      {
        title: 'Clean Code JavaScript',
        url: 'https://github.com/ryanmcdermott/clean-code-javascript',
      },
      { title: 'Big-O Cheat Sheet', url: 'https://www.bigocheatsheet.com/' },
    ];
  }

  private getNextKey(): string {
    const key = this.apiKeys[this.keyIndex];
    this.keyIndex = (this.keyIndex + 1) % this.apiKeys.length;
    return key;
  }
}
