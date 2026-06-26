import { Injectable } from '@nestjs/common';
import {
  IAiProvider,
  AiAnalysisInput,
  AiAnalysisResult,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class MockAiProvider implements IAiProvider {
  async analyze(input: AiAnalysisInput): Promise<AiAnalysisResult> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      summary: `Mock analysis for ${input.language} code (${input.code.length} characters). The code demonstrates basic understanding of the topic.`,
      strengths: [
        'Code is readable and easy to follow',
        'Logic is straightforward',
        'No obvious syntax errors',
      ],
      improvements: [
        'Consider adding error handling',
        'Variable names could be more descriptive',
        'Missing edge case handling for empty inputs',
      ],
      refactoringSuggestion:
        'Extract repeated logic into helper functions to improve reusability.',
      resources: [
        {
          title: 'Clean Code Principles',
          url: 'https://www.freecodecamp.org/news/clean-coding-for-beginners',
        },
        {
          title: 'JavaScript Best Practices',
          url: 'https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines',
        },
      ],
      aiModel: 'mock-ai',
      modelVersion: '1.0.0',
    };
  }
}
