import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { AIMentorStyle, AIMentorTone } from '../../common/enums';
import { CreateQuestionDto } from '../../exercises/dto/question.dto';

// ===== Admin Config =====

export class UpsertConfigDto {
  @ApiProperty({ description: 'Any JSON-serializable value' })
  @IsNotEmpty()
  value!: unknown;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ConfigListQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by scope (e.g. "ai_mentor", "penalty", "battle")',
  })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ===== AI Mentor Config =====

export class AiMentorConfigDto {
  @ApiPropertyOptional({ enum: AIMentorStyle })
  @IsOptional()
  @IsEnum(AIMentorStyle)
  defaultStyle?: AIMentorStyle;

  @ApiPropertyOptional({ enum: AIMentorTone })
  @IsOptional()
  @IsEnum(AIMentorTone)
  defaultTone?: AIMentorTone;

  @ApiPropertyOptional({ example: 'gpt-4' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ minimum: 50, maximum: 4000, default: 300 })
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(4000)
  maxTokensPerMessage?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  maxMessagesPerSession?: number;

  @ApiPropertyOptional({
    description:
      'Constraint: AI may only output up to N lines of hint (doc says 1-2)',
    minimum: 1,
    maximum: 10,
    default: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  hintLineLimit?: number;

  @ApiPropertyOptional({
    description:
      'When false (default per Milestone 2 doc) AI never returns code snippets',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  allowCodeInOutput?: boolean;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxHintLevelsPerQuestion?: number;
}

// ===== Bulk Import =====

export class BulkImportQuestionsDto {
  @ApiProperty({ type: [CreateQuestionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions!: CreateQuestionDto[];

  @ApiPropertyOptional({
    description:
      'If true, existing questions with the same title are skipped instead of failing the whole batch.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  skipDuplicates?: boolean;
}
