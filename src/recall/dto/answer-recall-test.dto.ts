import { IsInt, IsMongoId, IsOptional, IsString, Min } from 'class-validator';

export class AnswerRecallTestDto {
  @IsMongoId()
  questionId!: string;

  @IsString()
  answer!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentSeconds?: number;
}
