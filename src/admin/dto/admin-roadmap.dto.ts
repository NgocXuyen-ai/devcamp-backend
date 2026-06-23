import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  CareerField,
  LessonLevel,
  NodeType,
  QuestionDifficulty,
} from '../../common/enums';

// ===== Milestone =====

export class MilestoneDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  order!: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  nodeIds?: string[];

  @ApiPropertyOptional({ enum: ['battle', 'project'] })
  @IsOptional()
  @IsString()
  gateType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  rewardXp?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  rewardCoins?: number;
}

// ===== Roadmap =====

export class CreateRoadmapDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CareerField })
  @IsEnum(CareerField)
  field!: CareerField;

  @ApiProperty({ enum: LessonLevel })
  @IsEnum(LessonLevel)
  level!: LessonLevel;

  @ApiPropertyOptional({ type: [MilestoneDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones?: MilestoneDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  totalEstimatedHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;
}

export class UpdateRoadmapDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [MilestoneDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones?: MilestoneDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  totalEstimatedHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;
}

export class RoadmapListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: CareerField })
  @IsOptional()
  @IsEnum(CareerField)
  field?: CareerField;

  @ApiPropertyOptional({ enum: LessonLevel })
  @IsOptional()
  @IsEnum(LessonLevel)
  level?: LessonLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ===== Node =====

export class NodeContentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  theory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  questionIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  labExerciseId?: string;
}

export class UnlockConditionDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  prerequisiteNodeIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  minScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresBattleWin?: boolean;
}

export class CreateNodeDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  milestoneOrder!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  order!: number;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: NodeType })
  @IsEnum(NodeType)
  type!: NodeType;

  @ApiPropertyOptional({ enum: QuestionDifficulty })
  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty;

  @ApiPropertyOptional({ type: NodeContentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NodeContentDto)
  content?: NodeContentDto;

  @ApiPropertyOptional({ type: UnlockConditionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UnlockConditionDto)
  unlockCondition?: UnlockConditionDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  rewardXp?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  rewardCoins?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;
}

export class UpdateNodeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: NodeType })
  @IsOptional()
  @IsEnum(NodeType)
  type?: NodeType;

  @ApiPropertyOptional({ enum: QuestionDifficulty })
  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty;

  @ApiPropertyOptional({ type: NodeContentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NodeContentDto)
  content?: NodeContentDto;

  @ApiPropertyOptional({ type: UnlockConditionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UnlockConditionDto)
  unlockCondition?: UnlockConditionDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  rewardXp?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  rewardCoins?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class NodeListQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  milestoneOrder?: number;

  @ApiPropertyOptional({ enum: NodeType })
  @IsOptional()
  @IsEnum(NodeType)
  type?: NodeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class PublishNodeDto {
  @ApiProperty()
  @IsBoolean()
  isPublished!: boolean;
}
