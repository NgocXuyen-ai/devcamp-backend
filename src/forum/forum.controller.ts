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
import { CreateCommentDto, CreatePostDto, ReactDto } from './dto/forum.dto';
import { ForumService } from './forum.service';

type JwtUser = { userId?: string | Types.ObjectId } | null;

/** Resolve the user id from JWT, falling back to a demo user for local dev. */
function getUserIdFromReq(req: Request): Types.ObjectId {
  const jwtUser = (req as unknown as { user?: JwtUser }).user;
  const raw = jwtUser?.userId;
  if (raw && Types.ObjectId.isValid(raw)) return new Types.ObjectId(raw);
  return new Types.ObjectId('64b000000000000000000001');
}

@ApiTags('Forum')
@Controller('forum')
@UseGuards(OptionalJwtAuthGuard)
export class ForumController {
  constructor(private readonly forum: ForumService) {}

  @Get('posts')
  getPosts(@Query('channelId') channelId: string) {
    return this.forum.getPosts(channelId);
  }

  @Post('posts')
  createPost(@Req() req: Request, @Body() dto: CreatePostDto) {
    return this.forum.createPost(
      getUserIdFromReq(req),
      dto.channelId,
      dto.body,
    );
  }

  @Post('posts/:id/react')
  reactToPost(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: ReactDto,
  ) {
    return this.forum.reactToPost(getUserIdFromReq(req), id, dto.emoji);
  }

  @Get('posts/:id/comments')
  getComments(@Param('id') id: string) {
    return this.forum.getComments(id);
  }

  @Post('posts/:id/comments')
  createComment(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.forum.createComment(getUserIdFromReq(req), id, dto.body);
  }

  @Post('comments/:id/react')
  reactToComment(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: ReactDto,
  ) {
    return this.forum.reactToComment(getUserIdFromReq(req), id, dto.emoji);
  }
}
