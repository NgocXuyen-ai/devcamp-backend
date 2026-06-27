import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * Authenticated, user-scoped history endpoints (under /me). Kept separate from
 * the public-ish /history controller; both delegate to HistoryService.
 */
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeHistoryController {
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
