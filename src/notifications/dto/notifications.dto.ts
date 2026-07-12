import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
} from 'class-validator';
import { NotificationType } from '../../common/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * Query params cho GET /notifications.
 * Kế thừa page/limit từ PaginationDto chung của dự án.
 */
export class GetNotificationsDto extends PaginationDto {
    @ApiPropertyOptional({ enum: NotificationType })
    @IsOptional()
    @IsEnum(NotificationType)
    type?: NotificationType;

    @ApiPropertyOptional({
        description: 'Lọc theo trạng thái đã đọc. Bỏ trống để lấy tất cả.',
    })
    @IsOptional()
    @Transform(({ value }): boolean | undefined => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return undefined;
    })
    @IsBoolean()
    read?: boolean;
}

/**
 * Tạo notification — dùng nội bộ (service-to-service) và bởi admin/hệ thống.
 * Không expose trực tiếp cho user thường tạo notification cho chính họ.
 */
export class CreateNotificationDto {
    @ApiProperty({ description: 'ID người nhận thông báo' })
    @IsMongoId()
    userId!: string;

    @ApiProperty({ enum: NotificationType })
    @IsEnum(NotificationType)
    type!: NotificationType;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    title!: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    body!: string;

    @ApiPropertyOptional({ description: 'Deep-link trong app, vd /battles/123' })
    @IsOptional()
    @IsString()
    actionUrl?: string;

    @ApiPropertyOptional({
        description: 'Payload tự do, vd { battleId, nodeId }',
    })
    @IsOptional()
    @IsObject()
    data?: Record<string, unknown>;

    @ApiPropertyOptional({ enum: ['low', 'normal', 'high'], default: 'normal' })
    @IsOptional()
    @IsString()
    priority?: string;

    @ApiPropertyOptional({
        description: 'Cấp độ leo thang (1-3), dùng cho streak reminder',
    })
    @IsOptional()
    escalationLevel?: number;
}

export class MarkReadDto {
    @ApiProperty({ type: [String], description: 'Danh sách notification id' })
    @IsMongoId({ each: true })
    ids!: string[];
}