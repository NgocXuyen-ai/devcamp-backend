import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';
import { CareerField, SkillLevel } from '../../common/enums';

/** Self-service profile update (the user editing their own account). */
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'ngocxuyen2025' })
  @IsOptional()
  @IsString()
  @Length(3, 32)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers and underscore',
  })
  username?: string;

  @ApiPropertyOptional({ example: 'https://cdn.cfg.dev/avatars/u123.png' })
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
