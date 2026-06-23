import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Types } from 'mongoose';

import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { BattlesService } from './battles.service';

import { CreateBattleDto } from './dto/create-battle.dto';
import { GetHistoryDto } from './dto/get-history.dto';
import { GetLeaderboardDto } from './dto/get-leaderboard.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

type JwtUser = {
  userId?: string | Types.ObjectId;
  username?: string;
  avatar?: string;
} | null;

/** Lấy user từ JWT nếu có, fallback demo user để chạy local không cần đăng nhập. */
function getUserFromReq(req: Request): {
  userId: string;
  username: string;
  avatar?: string;
} {
  const jwtUser = (req as unknown as { user?: JwtUser }).user;
  const raw = jwtUser?.userId;
  if (raw && Types.ObjectId.isValid(raw)) {
    return {
      userId: String(raw),
      username: jwtUser?.username ?? 'player',
      avatar: jwtUser?.avatar,
    };
  }
  return { userId: '507f1f77bcf86cd799439011', username: 'demo-user' };
}

@Controller('battles')
@UseGuards(OptionalJwtAuthGuard)
export class BattlesController {
  constructor(private readonly battlesService: BattlesService) {}

  @Post('match')
  create(@Req() req: Request, @Body() dto: CreateBattleDto) {
    return this.battlesService.createBattle(getUserFromReq(req), dto);
  }

  @Get('history')
  history(@Req() req: Request, @Query() dto: GetHistoryDto) {
    return this.battlesService.getUserHistory(getUserFromReq(req).userId, dto);
  }

  @Get('leaderboard')
  leaderboard(@Query() dto: GetLeaderboardDto) {
    return this.battlesService.getLeaderboard(dto);
  }

  @Post(':id/submit')
  submit(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.battlesService.submitAnswer(
      id,
      getUserFromReq(req).userId,
      dto,
    );
  }

  @Get(':id/submissions')
  submissions(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.battlesService.getSubmissions(id, userId);
  }

  @Post(':id/end') end(@Param('id') id: string) {
    return this.battlesService.endBattle(id);
  }

  @Post(':id/abandon')
  abandon(@Param('id') id: string, @Req() req: Request) {
    return this.battlesService.abandonBattle(id, getUserFromReq(req).userId);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Req() req: Request) {
    return this.battlesService.getBattleById(id, getUserFromReq(req).userId);
  }
}
