import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CareerField, UserRole } from '../../common/enums';

export class AdminUserListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by username or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: CareerField })
  @IsOptional()
  @IsEnum(CareerField)
  field?: CareerField;

  @ApiPropertyOptional({ description: 'Filter by isLocked' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isLocked?: boolean;
}

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Lock or unlock the account' })
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;
}
