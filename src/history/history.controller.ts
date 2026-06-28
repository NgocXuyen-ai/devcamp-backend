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
  }

  @Get('tracking')
  tracking(@Req() req: Request) {
    return this.historyService.getTracking(getUserIdFromReq(req));
  }

  @Delete('drafts/:id')
  removeDraft(@Req() req: Request, @Param('id') id: string) {
    return this.historyService.removeDraft(getUserIdFromReq(req), id);
  }
}
