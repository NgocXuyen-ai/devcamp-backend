import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IAiProvider,
  AiAnalysisInput,
  AiAnalysisResult,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class GroqAiProvider implements IAiProvider {
  private readonly apiKey: string;
  private readonly model = 'llama-3.3-70b-versatile';
  private readonly apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GROQ_API_KEY') ?? '';
    // console.log(
    //   'GROQ KEY loaded:',
    //   this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'EMPTY',
    // );
    this.apiKey = this.configService.get<string>('GROQ_API_KEY') ?? '';
  }

  async analyze(input: AiAnalysisInput): Promise<AiAnalysisResult> {
    const prompt = this.buildPrompt(input);
    // console.log(
    //   'Calling Groq with key:',
    //   this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'EMPTY',
    // );
    // console.log('API URL:', this.apiUrl);
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };

    const rawText = data.choices[0]?.message?.content ?? '';
    return this.parseResponse(rawText);
  }

  private buildPrompt(input: AiAnalysisInput): string {
    const testInfo = input.testResults
      ? `Test results: ${input.testResults.passed}/${input.testResults.totalTests} passed.`
      : '';

    return `You are a senior software engineer reviewing code from a coding battle.
Analyze the following ${input.language} code and respond ONLY with valid JSON (no markdown, no backticks).
${testInfo}
Code:
\`\`\`${input.language}
${input.code}
\`\`\`

Respond with exactly this JSON structure:
{
  "summary": "2-3 sentence overall assessment",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "refactoringSuggestion": "One concrete refactoring suggestion",
  "resources": [
    { "title": "Resource title", "url": "https://..." },
    { "title": "Resource title", "url": "https://..." }
  ]
}`;
  }

  private parseResponse(raw: string): AiAnalysisResult {
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean) as Omit<
        AiAnalysisResult,
        'aiModel' | 'modelVersion'
      >;
      return {
        ...parsed,
        aiModel: 'groq',
        modelVersion: this.model,
      };
    } catch {
      return {
        summary: 'Analysis could not be parsed.',
        strengths: [],
        improvements: [],
        refactoringSuggestion: '',
        resources: [],
        aiModel: 'groq',
        modelVersion: this.model,
      };
    }
  }
}
