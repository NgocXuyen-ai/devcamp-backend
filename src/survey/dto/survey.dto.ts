import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CareerField, DisciplineLevel, SkillLevel } from '../../common/enums';

export class CareerPathDto {
  @ApiProperty({ enum: CareerField })
  @IsEnum(CareerField)
  fieldFocus!: CareerField;

  @ApiPropertyOptional({
    enum: ['get_job', 'personal_project', 'competition', 'explore_ai'],
  })
  @IsOptional()
  @IsIn(['get_job', 'personal_project', 'competition', 'explore_ai'])
  learningGoal?: string;
}

export class SkillTestStartDto {
  @ApiProperty({ enum: CareerField })
  @IsEnum(CareerField)
  fieldFocus!: CareerField;

  @ApiPropertyOptional({ enum: SkillLevel })
  @IsOptional()
  @IsEnum(SkillLevel)
  selfAssessedLevel?: SkillLevel;

  @ApiPropertyOptional({ example: ['python', 'javascript'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  knownLanguages?: string[];

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 3,
    default: 3,
    description: 'Số bài coding muốn nhận (1–3)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  questionCount?: number;
}

export class CodeSolutionItemDto {
  @ApiProperty()
  @IsMongoId()
  questionId!: string;

  @ApiProperty({
    description: 'JavaScript code — phải định nghĩa function solve()',
    example: 'function solve(a, b) {\n  return a + b;\n}',
  })
  @IsString()
  @MaxLength(20000)
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timeSpentSeconds?: number;
}

export class SkillTestSubmitDto {
  @ApiProperty({ type: [CodeSolutionItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => CodeSolutionItemDto)
  solutions!: CodeSolutionItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalTimeSeconds?: number;
}

export class DisciplineDto {
  @ApiProperty({ minimum: 1, maximum: 24 })
  @IsInt()
  @Min(1)
  @Max(24)
  dailyHours!: number;

  @ApiProperty({ example: '20:00-22:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}-\d{2}:\d{2}$/)
  focusTimeWindow!: string;

  @ApiProperty({ enum: ['battle', 'project'] })
  @IsIn(['battle', 'project'])
  milestoneTestPreference!: 'battle' | 'project';

  @ApiProperty({ enum: DisciplineLevel })
  @IsEnum(DisciplineLevel)
  disciplineLevel!: DisciplineLevel;
}
