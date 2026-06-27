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
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Types } from 'mongoose';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { SendDirectMessageDto } from './dto/social.dto';
import { SocialService } from './social.service';

type JwtUser = { userId?: string | Types.ObjectId } | null;

/** Resolve the user id from JWT, falling back to a demo user for local dev. */
function getUserIdFromReq(req: Request): Types.ObjectId {
  const jwtUser = (req as unknown as { user?: JwtUser }).user;
  const raw = jwtUser?.userId;
  if (raw && Types.ObjectId.isValid(raw)) return new Types.ObjectId(raw);
  return new Types.ObjectId('64b000000000000000000001');
}

@ApiTags('Social')
@Controller('social')
@UseGuards(OptionalJwtAuthGuard)
export class SocialController {
  constructor(private readonly social: SocialService) {}

  @Get('profile/:id')
  getProfile(@Param('id') id: string) {
    return this.social.getProfile(id);
  }

  @Get('search')
  search(@Req() req: Request, @Query('query') query: string) {
    return this.social.search(query, getUserIdFromReq(req));
  }

  // ===== Friend requests =====
  @Post('friend-request/:id')
  sendFriendRequest(@Req() req: Request, @Param('id') id: string) {
    return this.social.sendFriendRequest(getUserIdFromReq(req), id);
  }

  @Get('friend-requests')
  getFriendRequests(@Req() req: Request) {
    return this.social.getFriendRequests(getUserIdFromReq(req));
  }

  @Post('friend-request/:id/accept')
  acceptFriendRequest(@Req() req: Request, @Param('id') id: string) {
    return this.social.acceptFriendRequest(getUserIdFromReq(req), id);
  }

  @Post('friend-request/:id/reject')
  rejectFriendRequest(@Req() req: Request, @Param('id') id: string) {
    return this.social.rejectFriendRequest(getUserIdFromReq(req), id);
  }

  @Get('friends')
  getFriends(@Req() req: Request) {
    return this.social.getFriends(getUserIdFromReq(req));
  }

  // ===== Follow =====
  @Post('follow/:id')
  follow(@Req() req: Request, @Param('id') id: string) {
    return this.social.follow(getUserIdFromReq(req), id);
  }

  @Post('unfollow/:id')
  unfollow(@Req() req: Request, @Param('id') id: string) {
    return this.social.unfollow(getUserIdFromReq(req), id);
  }

  // ===== Direct messages =====
  @Post('dm/:id')
  sendDirectMessage(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: SendDirectMessageDto,
  ) {
    return this.social.sendDirectMessage(getUserIdFromReq(req), id, dto.body);
  }

  @Get('dm/:id')
  getConversation(@Req() req: Request, @Param('id') id: string) {
    return this.social.getConversation(getUserIdFromReq(req), id);
  }
}
