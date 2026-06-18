import { IsInt, Max, Min } from 'class-validator';

export class ReviewRecallDto {
  @IsInt()
  @Min(0)
  @Max(5)
  quality!: number;
}
