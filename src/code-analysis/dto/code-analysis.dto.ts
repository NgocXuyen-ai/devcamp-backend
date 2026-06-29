import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAnalysisDto {
  @ApiProperty()
  @IsMongoId()
  battleId!: string;

  @ApiProperty({ description: 'Source code to analyse' })
  @IsString()
  @MaxLength(40000)
  code!: string;

  @ApiPropertyOptional({ example: 'javascript' })
  @IsOptional()
  @IsString()
  language?: string;
}
