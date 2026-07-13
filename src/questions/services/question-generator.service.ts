import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question } from '../../exercises/schemas/question.schema';
import { QUESTION_GENERATOR } from '../interfaces/question-generator.token';
import type {
  IQuestionGenerator,
  GenerateQuestionInput,
} from '../interfaces/question-generator.interface';

export interface GenerateResult {
  requested: number;
  saved: number;
  questions: Record<string, unknown>[];
}

@Injectable()
export class QuestionGeneratorService {
  private readonly logger = new Logger(QuestionGeneratorService.name);

  constructor(
    @InjectModel(Question.name)
    private readonly questionModel: Model<Question>,

    @Inject(QUESTION_GENERATOR)
    private readonly generator: IQuestionGenerator,
  ) {}

  async generate(input: GenerateQuestionInput): Promise<GenerateResult> {
    this.logger.log(
      `Generating ${input.count} ${input.difficulty} ${input.field} questions (${input.questionType})`,
    );

    // 1. Gọi AI generate
    const generated = await this.generator.generateQuestions(input);

    // 2. Map sang schema format + lưu DB
    const docs = generated.map((q) => {
      const base = {
        title: q.title,
        content: q.content,
        explanation: q.explanation,
        category: [q.category],
        field: input.field,
        difficulty: input.difficulty,
        isAiGenerated: true,
      };

      if (input.questionType === 'coding_challenge') {
        return {
          ...base,
          type: 'coding',
          templates: q.starterCode
            ? [
                {
                  language: 'javascript',
                  starterCode: q.starterCode,
                  solution: q.correctAnswer,
                },
              ]
            : [],
          testCases: q.testCases
            ?.filter(
              (tc) =>
                tc.expectedOutput !== undefined && tc.expectedOutput !== null,
            )
            .map((tc) => ({
              input: Array.isArray(tc.input)
                ? JSON.stringify(tc.input)
                : String(tc.input ?? ''),
              expectedOutput: String(tc.expectedOutput),
            })),
        };
      }

      // output_prediction / fill_blank
      return {
        ...base,
        type: 'coding',
        testCases: [
          {
            input: 'N/A',
            expectedOutput: q.correctAnswer,
            isHidden: false,
            explanation: q.explanation,
            weight: 1,
          },
        ],
      };
    });

    const saved = await this.questionModel.insertMany(docs);
    const result = saved.map(
      (doc) => doc.toObject() as unknown as Record<string, unknown>,
    );

    this.logger.log(
      `Saved ${saved.length}/${generated.length} questions to DB`,
    );

    return {
      requested: input.count,
      saved: saved.length,
      questions: result,
    };
  }
}
