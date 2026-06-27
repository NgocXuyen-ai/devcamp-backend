import { Controller, Delete, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Types } from 'mongoose';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { HistoryService } from './history.service';

type JwtUser = { userId?: string | Types.ObjectId } | null;

function getUserIdFromReq(req: Request): Types.ObjectId {
  const jwtUser = (req as unknown as { user?: JwtUser }).user;
  const raw = jwtUser?.userId;
  if (raw && Types.ObjectId.isValid(raw)) return new Types.ObjectId(raw);
  return new Types.ObjectId('64b000000000000000000001');
}

@Controller('history')
@UseGuards(OptionalJwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get('finished')
  finished(@Req() req: Request) {
    return this.historyService.getFinished(getUserIdFromReq(req));
  }

  @Get('unfinished')
  unfinished(@Req() req: Request) {
    return this.historyService.getUnfinished(getUserIdFromReq(req));
  }

  @Get('bookmarks')
  bookmarks(@Req() req: Request) {
    return this.historyService.getBookmarks(getUserIdFromReq(req));
  }

  @Delete('bookmarks/:id')
  removeBookmark(@Req() req: Request, @Param('id') id: string) {
    return this.historyService.removeBookmark(getUserIdFromReq(req), id);
  }

  @Get('activity')
  activity(@Req() req: Request) {
    return this.historyService.getActivity(getUserIdFromReq(req));
import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

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
