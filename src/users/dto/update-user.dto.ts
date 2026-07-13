import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CareerField, SkillLevel } from '../../common/enums';

// GitHub cho phép chữ, số, dấu gạch ngang (không đứng đầu/cuối/liên tiếp) —
// nới lỏng một chút cho đơn giản, chỉ chặn khoảng trắng và ký tự đặc biệt rõ ràng sai.
const SOCIAL_HANDLE_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

class UpdateSocialLinksDto {
  @ApiPropertyOptional({
    example: 'tranminhkhoi8407-dev',
    description: 'GitHub username, không phải URL đầy đủ',
  })
  @IsOptional()
  @IsString()
  @MaxLength(39)
  @Matches(SOCIAL_HANDLE_REGEX, {
    message: 'GitHub username không hợp lệ',
  })
  github?: string;

  @ApiPropertyOptional({ example: 'tranminhkhoi' })
  @IsOptional()
  @IsString()
  @MaxLength(39)
  @Matches(SOCIAL_HANDLE_REGEX, {
    message: 'LinkedIn username không hợp lệ',
  })
  linkedin?: string;

  @ApiPropertyOptional({ example: 'tmk_dev' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  @Matches(SOCIAL_HANDLE_REGEX, {
    message: 'X (Twitter) username không hợp lệ',
  })
  twitter?: string;

  @ApiPropertyOptional({ example: 'https://tranminhkhoi.dev' })
  @IsOptional()
  @IsUrl()
  @MaxLength(200)
  website?: string;
}

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

  @ApiPropertyOptional({
    example: 'Fullstack dev · thi thoảng làm CTF cho vui.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  bio?: string;

  @ApiPropertyOptional({ example: 'Ho Chi Minh City, Vietnam' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  location?: string;

  @ApiPropertyOptional({ type: UpdateSocialLinksDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSocialLinksDto)
  socialLinks?: UpdateSocialLinksDto;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showProfile?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showCertificates?: boolean;
}
