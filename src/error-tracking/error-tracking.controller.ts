import { Controller, Get, Post, Param, UseGuards, Query } from '@nestjs/common';
import { ErrorTrackingService } from './error-tracking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class ErrorTrackingController {
  constructor(private readonly errorTrackingService: ErrorTrackingService) {}

  @Get('errors')
  async getMyErrors(
    @CurrentUser() user: { userId: string },
    @Query('type') type?: string,
    @Query('resolved') resolved?: string,
  ) {
    const data = await this.errorTrackingService.getMyErrors(
      user.userId,
      type,
      resolved,
    );
    return { success: true, data };
  }

  @Get('errors/diagnostic')
  async getDiagnosticData(@CurrentUser() user: { userId: string }) {
    const charts = await this.errorTrackingService.getDiagnosticData(
      user.userId,
    );
    return {
      success: true,
      data: charts,
      insightText:
        'Hệ thống nhận thấy bạn thường mắc lỗi ở phần Logic và Performance. Hãy chú ý tối ưu vòng lặp nhé!',
    };
  }

  @Get('errors/:id')
  async getErrorDetail(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    const data = await this.errorTrackingService.getErrorDetail(
      user.userId,
      id,
    );
    return { success: true, data };
  }

  @Post('errors/:id/resolve')
  async resolveError(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    const data = await this.errorTrackingService.resolveError(user.userId, id);
    return { success: true, message: 'Đã đánh dấu hiểu lỗi thành công!', data };
  }
}
