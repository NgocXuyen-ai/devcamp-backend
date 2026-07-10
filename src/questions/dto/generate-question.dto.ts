import { IsEnum, IsInt, IsNotEmpty, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateQuestionDto {
  @IsNotEmpty()
  @IsEnum(['frontend', 'backend', 'fullstack'], {
    message: 'field must be frontend, backend, or fullstack',
  })
  field!: string;

  @IsNotEmpty()
  @IsEnum(['easy', 'medium', 'hard'], {
    message: 'difficulty must be easy, medium, or hard',
  })
  difficulty!: string;

  @IsNotEmpty()
  @IsEnum(['output_prediction', 'fill_blank', 'coding_challenge'], {
    message:
      'questionType must be output_prediction, fill_blank, or coding_challenge',
  })
  questionType!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  count!: number;
}
