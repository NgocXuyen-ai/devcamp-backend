import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { CareerField, SkillLevel } from '../../common/enums';

/** Self-service profile update (the user editing their own account). */
export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({ enum: CareerField })
  @IsOptional()
  @IsEnum(CareerField)
  fieldFocus?: CareerField;

  @ApiPropertyOptional({ enum: SkillLevel })
  @IsOptional()
  @IsEnum(SkillLevel)
  selfAssessedLevel?: SkillLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  learningGoal?: string;
}
