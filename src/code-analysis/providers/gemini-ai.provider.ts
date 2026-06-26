import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IAiProvider,
  AiAnalysisInput,
  AiAnalysisResult,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class GeminiAiProvider implements IAiProvider {
  private readonly apiKey = process.env.GEMINI_API_KEY ?? '';
  private readonly model = 'gemini-2.0-flash';
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') ?? '';
    this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
  }
  async analyze(input: AiAnalysisInput): Promise<AiAnalysisResult> {
    const prompt = this.buildPrompt(input);

    const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      candidates: { content: { parts: { text: string }[] } }[];
    };

    const rawText = data.candidates[0]?.content?.parts[0]?.text ?? '';
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
        aiModel: 'gemini',
        modelVersion: this.model,
      };
    } catch {
      return {
        summary: 'Analysis could not be parsed.',
        strengths: [],
        improvements: [],
        refactoringSuggestion: '',
        resources: [],
        aiModel: 'gemini',
        modelVersion: this.model,
      };
    }
  }
}
