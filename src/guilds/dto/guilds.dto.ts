import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { GUILD_TYPES } from '../schemas/guild.schema';

const GUILD_SORT_OPTIONS = ['rank', 'members', 'winRate', 'weeklyXP'] as const;

const normalizeGuildTags = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export class GetGuildsQueryDto {
  @ApiPropertyOptional({ enum: GUILD_TYPES })
  @IsOptional()
  @IsIn(GUILD_TYPES)
  type?: (typeof GUILD_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  @ApiPropertyOptional({ enum: GUILD_SORT_OPTIONS })
  @IsOptional()
  @IsIn(GUILD_SORT_OPTIONS)
  sortBy?: (typeof GUILD_SORT_OPTIONS)[number];
}

export class CreateGuildDto {
  @ApiProperty({ example: 'Pixel Pioneers VN' })
  @IsString()
  @MinLength(4)
  @MaxLength(48)
  name!: string;

  @ApiProperty({ enum: GUILD_TYPES })
  @IsIn(GUILD_TYPES)
  type!: (typeof GUILD_TYPES)[number];

  @ApiProperty({
    example: 'Một bang hội tập trung vào React, design systems và performance.',
  })
  @IsString()
  @MinLength(24)
  @MaxLength(320)
  description!: string;

  @ApiPropertyOptional({
    example: 'Chúng tôi xây UI đỉnh, review nhau kỹ và đi rank mỗi tuần.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  recruitmentPitch?: string;

  @ApiPropertyOptional({ example: 'TypeScript / React' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  language?: string;

  @ApiPropertyOptional({ example: 'Ho Chi Minh City' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  headquarters?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @Transform(({ value }) => value !== false && value !== 'false')
  @IsBoolean()
  openToJoin?: boolean;

  @ApiPropertyOptional({ example: 120, default: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(20)
  @Max(500)
  maxMembers?: number;

  @ApiPropertyOptional({ type: [String], example: ['React', 'TypeScript'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @Transform(({ value }) => normalizeGuildTags(value))
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateGuildDto {
  @ApiPropertyOptional({ example: 'Pixel Pioneers VN' })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(48)
  name?: string;

  @ApiPropertyOptional({ enum: GUILD_TYPES })
  @IsOptional()
  @IsIn(GUILD_TYPES)
  type?: (typeof GUILD_TYPES)[number];

  @ApiPropertyOptional({
    example: 'Một bang hội tập trung vào React, design systems và performance.',
  })
  @IsOptional()
  @IsString()
  @MinLength(24)
  @MaxLength(320)
  description?: string;

  @ApiPropertyOptional({
    example: 'Build những trải nghiệm frontend mượt, đẹp và scale tốt.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  mission?: string;

  @ApiPropertyOptional({
    example: 'Chúng tôi build UI đỉnh, review kỹ và đi rank đều mỗi tuần.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  recruitmentPitch?: string;

  @ApiPropertyOptional({ example: 'TypeScript / React' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  language?: string;

  @ApiPropertyOptional({ example: 'Ho Chi Minh City' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  headquarters?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value !== false && value !== 'false')
  @IsBoolean()
  openToJoin?: boolean;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(20)
  @Max(500)
  maxMembers?: number;

  @ApiPropertyOptional({ type: [String], example: ['React', 'TypeScript'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @Transform(({ value }) => normalizeGuildTags(value))
  @IsString({ each: true })
  tags?: string[];
}

export class CreateGuildQuestDto {
  @ApiProperty({ example: 'Ship landing page revamp' })
  @IsString()
  @MinLength(4)
  @MaxLength(80)
  title!: string;

  @ApiProperty({
    example: 'Hoàn thành bản revamp landing page và merge vào main.',
  })
  @IsString()
  @MinLength(12)
  @MaxLength(240)
  description!: string;

  @ApiProperty({ example: 'Delivery' })
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  category!: string;

  @ApiProperty({ example: 'Medium' })
  @IsString()
  @MinLength(3)
  @MaxLength(24)
  difficulty!: string;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  total!: number;

  @ApiProperty({ example: 1500 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rewardXp!: number;

  @ApiProperty({ example: 120 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rewardCoins!: number;

  @ApiPropertyOptional({ example: 7, default: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  dueInDays?: number;
}
