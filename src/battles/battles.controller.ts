import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { BattlesService } from './battles.service';

import { CreateBattleDto } from './dto/create-battle.dto';
import { GetHistoryDto } from './dto/get-history.dto';
import { GetLeaderboardDto } from './dto/get-leaderboard.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
@Controller('battles')
@UseGuards(JwtAuthGuard)
export class BattlesController {
  constructor(private readonly battlesService: BattlesService) {}

  @Post('match')
  create(
    @CurrentUser() user: { userId: string; username: string; avatar?: string },
    @Body() dto: CreateBattleDto,
  ) {
    return this.battlesService.createBattle(user, dto);
  }

  @Get('history')
  history(
    @CurrentUser() user: { userId: string },
    @Query() dto: GetHistoryDto,
  ) {
    return this.battlesService.getUserHistory(user.userId, dto);
  }

  @Get('leaderboard')
  leaderboard(@Query() dto: GetLeaderboardDto) {
    return this.battlesService.getLeaderboard(dto);
  }

  @Post(':battleId/submit')
  submit(
    @Param('battleId') battleId: string, // khớp
    @CurrentUser() user: { userId: string },
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.battlesService.submitAnswer(battleId, user.userId, dto);
  }

  @Get(':battleId/submissions')
  submissions(
    @Param('battleId') battleId: string,
    @Query('userId') userId?: string,
  ) {
    return this.battlesService.getSubmissions(battleId, userId);
  }

  @Post(':battleId/end')
  end(@Param('battleId') battleId: string) {
    return this.battlesService.endBattle(battleId);
  }

  @Post(':battleId/abandon')
  abandon(
    @Param('battleId') battleId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.battlesService.abandonBattle(battleId, user.userId);
  }
  @Post(':battleId/cancel-match')
  cancelMatch(
    @Param('battleId') battleId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.battlesService.cancelMatchmaking(battleId, user.userId);
  }

  @Get(':battleId')
  getOne(
    @Param('battleId') battleId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.battlesService.getBattleById(battleId, user.userId);
  }
}
