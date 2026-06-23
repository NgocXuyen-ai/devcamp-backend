import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  CareerField,
  QuestionDifficulty,
  QuestionType,
} from '../../common/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';

// ===== Nested =====

export class TestCaseDto {
  @ApiProperty()
  @IsString()
  input!: string;

  @ApiProperty()
  @IsString()
  expectedOutput!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  weight?: number;
}

export class MultipleChoiceOptionDto {
  @ApiProperty()
  @IsString()
  text!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class CodeTemplateDto {
  @ApiProperty()
  @IsString()
  language!: string;

  @ApiPropertyOptional({ default: '' })
  @IsOptional()
  @IsString()
  starterCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  solution?: string;
}

// ===== Create =====

export class CreateQuestionDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  content!: string;

  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  type!: QuestionType;

  @ApiProperty({ enum: QuestionDifficulty })
  @IsEnum(QuestionDifficulty)
  difficulty!: QuestionDifficulty;

  @ApiProperty({ enum: CareerField })
  @IsEnum(CareerField)
  field!: CareerField;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  category?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: [MultipleChoiceOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MultipleChoiceOptionDto)
  options?: MultipleChoiceOptionDto[];

  @ApiPropertyOptional({ type: [CodeTemplateDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CodeTemplateDto)
  templates?: CodeTemplateDto[];

  @ApiPropertyOptional({ type: [TestCaseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestCaseDto)
  testCases?: TestCaseDto[];

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  timeLimitSeconds?: number;

  @ApiPropertyOptional({ default: 256 })
  @IsOptional()
  @IsInt()
  @Min(1)
  memoryLimitMb?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hints?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

// ===== Filter / list =====

export class QuestionFilterDto extends PaginationDto {
  @ApiPropertyOptional({ enum: CareerField })
  @IsOptional()
  @IsEnum(CareerField)
  field?: CareerField;

  @ApiPropertyOptional({ enum: QuestionDifficulty })
  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty;

  @ApiPropertyOptional({ enum: QuestionType })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional({ description: 'Single tag to match' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: 'Single category to match' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Search in title' })
  @IsOptional()
  @IsString()
  search?: string;
}
