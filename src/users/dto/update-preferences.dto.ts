import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { DisciplineLevel } from '../../common/enums';

/** Onboarding / settings: study schedule + discipline configuration. */
export class UpdatePreferencesDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 24 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  dailyStudyHours?: number;

  @ApiPropertyOptional({ example: '20:00-22:00' })
  @IsOptional()
  @IsString()
  focusTimeWindow?: string;

  @ApiPropertyOptional({ enum: DisciplineLevel })
  @IsOptional()
  @IsEnum(DisciplineLevel)
  disciplineLevel?: DisciplineLevel;

  @ApiPropertyOptional({ enum: ['battle', 'project'] })
  @IsOptional()
  @IsString()
  milestoneTestPreference?: string;
}
