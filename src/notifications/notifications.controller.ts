import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { GetNotificationsDto, MarkReadDto } from './dto/notifications.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
    constructor(private readonly notifications: NotificationsService) { }

    @Get()
    @ApiOperation({ summary: 'Danh sách thông báo của tôi (có phân trang, lọc)' })
    findMine(
        @CurrentUser('userId') userId: Types.ObjectId,
        @Query() query: GetNotificationsDto,
    ) {
        return this.notifications.findForUser(userId.toString(), query);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Số thông báo chưa đọc (hiển thị badge trên chuông)' })
    async unreadCount(@CurrentUser('userId') userId: Types.ObjectId) {
        const count = await this.notifications.countUnread(userId.toString());
        return { unreadCount: count };
    }

    @Patch('read')
    @ApiOperation({ summary: 'Đánh dấu đã đọc 1 hoặc nhiều thông báo' })
    markRead(
        @CurrentUser('userId') userId: Types.ObjectId,
        @Body() dto: MarkReadDto,
    ) {
        return this.notifications.markRead(userId.toString(), dto.ids);
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Đánh dấu tất cả thông báo là đã đọc' })
    markAllRead(@CurrentUser('userId') userId: Types.ObjectId) {
        return this.notifications.markAllRead(userId.toString());
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xóa 1 thông báo' })
    remove(
        @CurrentUser('userId') userId: Types.ObjectId,
        @Param('id') id: string,
    ) {
        return this.notifications.remove(userId.toString(), id);
    }
}