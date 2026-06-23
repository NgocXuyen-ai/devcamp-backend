import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { CareerField } from '../../common/enums';

export class AnalyticsRangeDto {
  @ApiPropertyOptional({
    description: 'ISO date. Defaults to 30 days ago.',
    example: '2025-05-01',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({ description: 'ISO date. Defaults to now.' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @ApiPropertyOptional({
    enum: ['hour', 'day', 'week', 'month'],
    default: 'day',
  })
  @IsOptional()
  @IsIn(['hour', 'day', 'week', 'month'])
  granularity?: 'hour' | 'day' | 'week' | 'month';

  @ApiPropertyOptional({ enum: CareerField })
  @IsOptional()
  @IsEnum(CareerField)
  field?: CareerField;
}

export class TopUsersQueryDto extends AnalyticsRangeDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
