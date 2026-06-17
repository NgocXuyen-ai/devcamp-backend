import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get('histories')
  async getMyLearningHistory(
    @CurrentUser() user: { userId: string },
    @Query('action') action?: string,
  ) {
    const data = await this.historyService.getMyLearningHistory(
      user.userId,
      action,
    );
    return { success: true, data };
  }

  @Get('histories/analytics')
  async getMyAnalytics(@CurrentUser() user: { userId: string }) {
    const data = await this.historyService.getMyAnalytics(user.userId);
    return { success: true, data };
  }

  @Get('bookmarks')
  async getMyBookmarks(@CurrentUser() user: { userId: string }) {
    const data = await this.historyService.getMyBookmarks(user.userId);
    return { success: true, data };
  }

  @Post('bookmarks')
  async toggleBookmark(
    @CurrentUser() user: { userId: string },
    @Body()
    payload: {
      nodeId?: string;
      questionId?: string;
      exerciseId?: string;
      note?: string;
      tags?: string[];
    },
  ) {
    const result = await this.historyService.toggleBookmark(
      user.userId,
      payload,
    );
    return { success: true, ...result };
  }
}
