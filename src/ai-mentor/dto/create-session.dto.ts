import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { AIMentorStyle, AIMentorTone } from '../../common/enums';

export class CreateSessionDto {
  /** Context: user đang làm bài nào */
  @IsOptional()
  @IsMongoId()
  nodeId?: string;

  @IsOptional()
  @IsMongoId()
  questionId?: string;

  @IsOptional()
  @IsMongoId()
  exerciseId?: string;

  @IsOptional()
  @IsMongoId()
  battleId?: string;

  @IsOptional()
  @IsEnum(AIMentorStyle)
  style?: AIMentorStyle;

  @IsOptional()
  @IsEnum(AIMentorTone)
  tone?: AIMentorTone;

  /** FE build context summary gửi lên, lưu để gắn vào prompt */
  @IsOptional()
  @IsString()
  contextSummary?: string;
}
