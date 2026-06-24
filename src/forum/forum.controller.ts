import { Controller, Get, Post, Body, Param, Req, Query } from '@nestjs/common';
import { ForumService } from './forum.service';

@Controller('forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Post('posts')
  createPost(@Req() req: any, @Body() body: { channelId: string; body: string }) {
    const authorId = req.headers['x-user-id'] || req.user?.sub || req.user?._id;
    return this.forumService.createPost(authorId, body.channelId, body.body);
  }

  @Get('posts')
  getPosts(@Query('channelId') channelId: string) {
    return this.forumService.getPosts(channelId);
  }

  @Post('posts/:postId/react')
  reactToPost(@Req() req: any, @Param('postId') postId: string, @Body('emoji') emoji: string) {
    const userId = req.headers['x-user-id'] || req.user?.sub || req.user?._id;
    return this.forumService.reactToPost(postId, userId, emoji);
  }

  @Post('posts/:postId/comments')
  createComment(@Req() req: any, @Param('postId') postId: string, @Body('body') body: string) {
    const authorId = req.headers['x-user-id'] || req.user?.sub || req.user?._id;
    return this.forumService.createComment(postId, authorId, body);
  }

  @Get('posts/:postId/comments')
  getComments(@Param('postId') postId: string) {
    return this.forumService.getComments(postId);
  }

  @Post('comments/:commentId/react')
  reactToComment(@Req() req: any, @Param('commentId') commentId: string, @Body('emoji') emoji: string) {
    const userId = req.headers['x-user-id'] || req.user?.sub || req.user?._id;
    return this.forumService.reactToComment(commentId, userId, emoji);
  }
}
