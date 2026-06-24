import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { SocialService } from './social.service';

// Assuming there's a guard to get req.user (which should have _id)
// We'll simulate user ID extraction or use headers for now if auth is not fully configured

@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('friend-request/:recipientId')
  sendFriendRequest(@Req() req: any, @Param('recipientId') recipientId: string) {
    // Ideally use req.user._id
    const requesterId = req.headers['x-user-id'] || req.user?.sub || req.user?._id;
    return this.socialService.sendFriendRequest(requesterId, recipientId);
  }

  @Get('friend-requests')
  getFriendRequests(@Req() req: any) {
    const userId = req.headers['x-user-id'] || req.user?.sub || req.user?._id;
    return this.socialService.getFriendRequests(userId);
  }

  @Post('friend-request/:requesterId/accept')
  acceptFriendRequest(@Req() req: any, @Param('requesterId') requesterId: string) {
    const recipientId = req.headers['x-user-id'] || req.user?.sub || req.user?._id;
    return this.socialService.acceptFriendRequest(requesterId, recipientId);
  }

  @Post('friend-request/:requesterId/reject')
  rejectFriendRequest(@Req() req: any, @Param('requesterId') requesterId: string) {
    const recipientId = req.headers['x-user-id'] || req.user?.sub || req.user?._id;
    return this.socialService.rejectFriendRequest(requesterId, recipientId);
  }

  @Get('friends')
  getFriends(@Req() req: any) {
    const userId = req.headers['x-user-id'] || req.user?.sub || req.user?._id;
    return this.socialService.getFriends(userId);
  }

  @Post('follow/:followingId')
  followUser(@Req() req: any, @Param('followingId') followingId: string) {
    const followerId = req.headers['x-user-id'] || req.user?.sub || req.user?._id;
    return this.socialService.followUser(followerId, followingId);
  }

  @Post('unfollow/:followingId')
  unfollowUser(@Req() req: any, @Param('followingId') followingId: string) {
    const followerId = req.headers['x-user-id'] || req.user?.sub || req.user?._id;
    return this.socialService.unfollowUser(followerId, followingId);
  }

  @Get('profile/:userId')
  getUserProfile(@Param('userId') userId: string) {
    return this.socialService.getUserProfile(userId);
  }
}
