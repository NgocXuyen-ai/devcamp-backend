import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  IAiMentorProvider,
  AiMentorResponse,
} from '../interfaces/ai-mentor-provider.interface';

interface GroqMessage {
  role: string;
  content: string;
}

interface GroqChoice {
  message: {
    content: string;
  };
}

interface GroqResponse {
  choices: GroqChoice[];
  usage?: {
    total_tokens: number;
  };
}

@Injectable()
export class GroqMentorProvider implements IAiMentorProvider {
  private readonly logger = new Logger(GroqMentorProvider.name);
  private readonly apiKeys: string[];
  private readonly defaultModel: string;
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
    this.logger.log(`Loaded ${String(this.apiKeys.length)} Groq API keys`);
    this.defaultModel =
      this.configService.get<string>('GROQ_MODEL') || 'llama-3.1-8b-instant';
  }

  async chat(
    messages: GroqMessage[],
    model?: string,
  ): Promise<AiMentorResponse> {
    const useModel = model ?? this.defaultModel;

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.getNextKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: useModel,
          messages,
          temperature: 0.7,
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
    const tokenUsed = data.usage?.total_tokens ?? 0;

    return { content, tokenUsed };
  }

  private getNextKey(): string {
    const key = this.apiKeys[this.keyIndex];
    this.keyIndex = (this.keyIndex + 1) % this.apiKeys.length;
    return key;
  }
}
