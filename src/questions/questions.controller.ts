import { Body, Controller, Post } from '@nestjs/common';
import { QuestionGeneratorService } from './services/question-generator.service';
import { GenerateQuestionDto } from './dto/generate-question.dto';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly generatorService: QuestionGeneratorService) {}

  @Post('generate')
  generate(@Body() dto: GenerateQuestionDto) {
    return this.generatorService.generate({
      field: dto.field,
      difficulty: dto.difficulty,
      questionType: dto.questionType,
      count: dto.count,
    });
  }
}
