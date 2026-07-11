export interface GeneratedQuestion {
  title: string;
  content: string; // Đề bài (có thể chứa code snippet)
  correctAnswer: string; // Đáp án xác định (string match)
  explanation: string; // Giải thích
  category: string; // React, JavaScript, Node.js...
  starterCode?: string;
  testCases?: { input: string; expectedOutput: string; explanation?: string }[];
}

export interface GenerateQuestionInput {
  field: string; // frontend, backend
  difficulty: string; // easy, medium, hard
  questionType: string; // coding_challenge
  count: number; // số câu cần generate
}

export interface IQuestionGenerator {
  generateQuestions(input: GenerateQuestionInput): Promise<GeneratedQuestion[]>;
}
