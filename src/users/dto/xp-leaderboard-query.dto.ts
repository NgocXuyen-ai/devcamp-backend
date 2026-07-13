import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class XpLeaderboardQueryDto {
    @ApiPropertyOptional({
        minimum: 1,
        maximum: 50,
        default: 3,
        description: 'Số user top XP muốn lấy (vd: mini leaderboard trang chủ).',
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(String(value), 10))
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number = 3;
}