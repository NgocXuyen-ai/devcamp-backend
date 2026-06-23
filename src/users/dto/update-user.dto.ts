import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Length, Matches } from 'class-validator';

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
}
