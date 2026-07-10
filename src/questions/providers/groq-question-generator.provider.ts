import { Injectable, Logger } from '@nestjs/common';
import {
  IQuestionGenerator,
  GenerateQuestionInput,
  GeneratedQuestion,
} from '../interfaces/question-generator.interface';
import { buildGenerateQuestionPrompt } from '../prompts/generate-question.prompt';
interface GroqChatResponse {
  choices: { message: { content: string } }[];
}
@Injectable()
export class GroqQuestionGeneratorProvider implements IQuestionGenerator {
  private readonly logger = new Logger(GroqQuestionGeneratorProvider.name);
  private readonly apiKey = process.env.GROQ_API_KEY;
  private readonly model = 'llama-3.1-8b-instant';
  private readonly apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

  async generateQuestions(
    input: GenerateQuestionInput,
  ): Promise<GeneratedQuestion[]> {
    const prompt = buildGenerateQuestionPrompt(input);

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Groq API error: ${response.status} - ${errorText}`);
      throw new Error(`Groq API failed: ${response.status}`);
    }

    const data = (await response.json()) as GroqChatResponse;
    const rawContent = data.choices[0]?.message?.content ?? '';

    return this.parseQuestions(rawContent, input.count);
  }
  private isValidQuestion(q: unknown): q is GeneratedQuestion {
    if (typeof q !== 'object' || q === null) return false;
    const obj = q as Record<string, unknown>;

    const hasBasicFields =
      typeof obj.title === 'string' &&
      typeof obj.content === 'string' &&
      typeof obj.category === 'string' &&
      obj.title.length > 0;

    if (!hasBasicFields) return false;

    // correctAnswer HOẶC testCases phải có ít nhất 1 trong 2
    const hasCorrectAnswer =
      typeof obj.correctAnswer === 'string' && obj.correctAnswer.length > 0;
    const hasTestCases =
      Array.isArray(obj.testCases) && obj.testCases.length > 0;

    return hasCorrectAnswer || hasTestCases;
  }

  private parseQuestions(
    raw: string,
    expectedCount: number,
  ): GeneratedQuestion[] {
    // Xóa markdown fences nếu AI vẫn thêm
    const cleaned = raw
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
      this.logger.debug(
        `Parsed ${(parsed as unknown[]).length} questions from AI`,
      );
      this.logger.debug(
        `First question sample: ${JSON.stringify((parsed as unknown[])[0], null, 2)}`,
      );
    } catch {
      this.logger.error(
        `Failed to parse AI response: ${cleaned.slice(0, 200)}`,
      );
      throw new Error('AI response is not valid JSON');
    }

    if (!Array.isArray(parsed)) {
      throw new Error('AI response is not an array');
    }

    const valid = (parsed as unknown[]).filter((q): q is GeneratedQuestion =>
      this.isValidQuestion(q),
    );

    if (valid.length === 0) {
      throw new Error('No valid questions in AI response');
    }

    if (valid.length < expectedCount) {
      this.logger.warn(
        `Expected ${expectedCount} questions, got ${valid.length} valid`,
      );
    }

    return valid;
  }
}
