import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { DisciplineLevel } from '../../common/enums';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ minimum: 0.5, maximum: 24 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  dailyStudyHours?: number;

  @ApiPropertyOptional({ example: '20:00-22:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}-\d{2}:\d{2}$/, {
    message: 'focusTimeWindow must look like "HH:MM-HH:MM"',
  })
  focusTimeWindow?: string;

  @ApiPropertyOptional({ enum: DisciplineLevel })
  @IsOptional()
  @IsEnum(DisciplineLevel)
  disciplineLevel?: DisciplineLevel;

  @ApiPropertyOptional({ enum: ['battle', 'project'] })
  @IsOptional()
  @IsIn(['battle', 'project'])
  milestoneTestPreference?: 'battle' | 'project';
}
