import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const toInt = (value: unknown, fallback: number): number => {
  const parsed = parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Base query DTO that adds `page` / `limit` (and a derived `skip`)
 * to any list endpoint. Extend it in feature filter DTOs.
 */
export class PaginationDto {
  @ApiPropertyOptional({ minimum: 1, default: DEFAULT_PAGE })
  @IsOptional()
  @Transform(({ value }) => toInt(value, DEFAULT_PAGE))
  @IsInt()
  @Min(1)
  page?: number = DEFAULT_PAGE;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: MAX_LIMIT,
    default: DEFAULT_LIMIT,
  })
  @IsOptional()
  @Transform(({ value }) => toInt(value, DEFAULT_LIMIT))
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit?: number = DEFAULT_LIMIT;

  /** Mongo skip offset derived from page + limit. */
  get skip(): number {
    const page = this.page ?? DEFAULT_PAGE;
    const limit = this.limit ?? DEFAULT_LIMIT;
    return (page - 1) * limit;
  }
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Wraps a page of items in the standard pagination envelope. */
export function paginate<T>(
  items: T[],
  total: number,
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
): PaginatedResult<T> {
  const safeLimit = limit > 0 ? limit : DEFAULT_LIMIT;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  return {
    items,
    total,
    page,
    limit: safeLimit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
