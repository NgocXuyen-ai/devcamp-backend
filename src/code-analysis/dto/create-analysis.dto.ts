import {
  IsMongoId,
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

class TestResultsDto {
  @IsInt() @Min(0) passed!: number;
  @IsInt() @Min(0) failed!: number;
  @IsInt() @Min(0) totalTests!: number;
}

export class CreateAnalysisDto {
  @IsMongoId()
  battleId!: string;

  @IsNotEmpty()
  @IsString()
  code!: string;

  @IsNotEmpty()
  @IsString()
  language!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TestResultsDto)
  testResults?: TestResultsDto;
}
