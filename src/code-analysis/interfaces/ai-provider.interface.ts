export interface AiAnalysisResult {
  summary: string;
  strengths: string[];
  improvements: string[];
  refactoringSuggestion: string;
  resources: { title: string; url: string }[];
  aiModel: string;
  modelVersion?: string;
}

export interface AiAnalysisInput {
  code: string;
  language: string;
  testResults?: {
    passed: number;
    failed: number;
    totalTests: number;
  };
}
export interface IAiProvider {
  analyze(input: AiAnalysisInput): Promise<AiAnalysisResult>;
}

export const AI_PROVIDER = 'AI_PROVIDER_TOKEN';
