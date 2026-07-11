import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Types } from 'mongoose';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AiMentorService } from './ai-mentor.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GetSessionsDto } from './dto/get-sessions.dto';

@Controller('ai-mentor')
@UseGuards(JwtAuthGuard)
export class AiMentorController {
  constructor(private readonly aiMentorService: AiMentorService) {}

  @Post('sessions')
  async createSession(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Body() dto: CreateSessionDto,
  ) {
    return this.aiMentorService.createSession(String(userId), dto);
  }

  @Get('sessions')
  async getSessions(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Query() dto: GetSessionsDto,
  ) {
    return this.aiMentorService.getSessions(String(userId), dto);
  }

  @Get('sessions/:sessionId')
  async getSessionDetail(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Param('sessionId') sessionId: string,
  ) {
    return this.aiMentorService.getSessionDetail(sessionId, String(userId));
  }

  @Patch('sessions/:sessionId/close')
  async closeSession(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Param('sessionId') sessionId: string,
  ) {
    return this.aiMentorService.closeSession(sessionId, String(userId));
  }

  @Post('sessions/:sessionId/messages')
  async sendMessage(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Param('sessionId') sessionId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.aiMentorService.sendMessage(sessionId, String(userId), dto);
  }
}
