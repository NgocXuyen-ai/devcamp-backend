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
  private readonly apiKey: string;
  private readonly defaultModel: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('GROQ_API_KEY');
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
          Authorization: `Bearer ${this.apiKey}`,
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
}
