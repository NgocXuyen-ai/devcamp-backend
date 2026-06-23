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
  Min,
  ValidateNested,
} from 'class-validator';
import { CareerField, DisciplineLevel, SkillLevel } from '../common/enums';

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
}

export class SkillTestAnswerItemDto {
  @ApiProperty()
  @IsMongoId()
  questionId!: string;

  @ApiProperty()
  @IsString()
  answer!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timeSpentSeconds?: number;
}

export class SkillTestSubmitDto {
  @ApiProperty({ type: [SkillTestAnswerItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => SkillTestAnswerItemDto)
  answers!: SkillTestAnswerItemDto[];

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
