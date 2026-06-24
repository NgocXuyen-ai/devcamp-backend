import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FriendRequest, FriendRequestDocument } from './schemas/friend-request.schema';
import { User, UserDocument } from '../users/schemas/users.schema';

@Injectable()
export class SocialService {
  constructor(
    @InjectModel(FriendRequest.name) private friendRequestModel: Model<FriendRequestDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async sendFriendRequest(requesterId: string, recipientId: string) {
    if (requesterId === recipientId) {
      throw new BadRequestException("Cannot send friend request to yourself");
    }

    const existingRequest = await this.friendRequestModel.findOne({
      requesterId,
      recipientId,
    });

    if (existingRequest) {
      throw new BadRequestException("Friend request already sent");
    }

    // Check reverse request
    const reverseRequest = await this.friendRequestModel.findOne({
      requesterId: recipientId,
      recipientId: requesterId,
    });

    if (reverseRequest) {
      if (reverseRequest.status === 'pending') {
        return this.acceptFriendRequest(recipientId, requesterId);
      }
    }

    const request = new this.friendRequestModel({ requesterId, recipientId, status: 'pending' });
    return request.save();
  }

  async getFriendRequests(userId: string) {
    return this.friendRequestModel.find({ recipientId: userId, status: 'pending' }).populate('requesterId', 'username avatarUrl');
  }

  async acceptFriendRequest(requesterId: string, recipientId: string) {
    const request = await this.friendRequestModel.findOne({ requesterId, recipientId, status: 'pending' });
    if (!request) {
      throw new NotFoundException("Friend request not found");
    }

    request.status = 'accepted';
    await request.save();

    await this.userModel.findByIdAndUpdate(requesterId, { $addToSet: { friends: recipientId } });
    await this.userModel.findByIdAndUpdate(recipientId, { $addToSet: { friends: requesterId } });

    return { message: "Friend request accepted" };
  }

  async rejectFriendRequest(requesterId: string, recipientId: string) {
    const request = await this.friendRequestModel.findOne({ requesterId, recipientId, status: 'pending' });
    if (!request) {
      throw new NotFoundException("Friend request not found");
    }

    request.status = 'rejected';
    await request.save();

    return { message: "Friend request rejected" };
  }

  async getFriends(userId: string) {
    const user = await this.userModel.findById(userId).populate('friends', 'username avatarUrl fieldFocus role gamification');
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user.friends;
  }

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) throw new BadRequestException("Cannot follow yourself");

    await this.userModel.findByIdAndUpdate(followerId, { $addToSet: { following: followingId } });
    await this.userModel.findByIdAndUpdate(followingId, { $addToSet: { followers: followerId } });

    return { message: "Successfully followed user" };
  }

  async unfollowUser(followerId: string, followingId: string) {
    await this.userModel.findByIdAndUpdate(followerId, { $pull: { following: followingId } });
    await this.userModel.findByIdAndUpdate(followingId, { $pull: { followers: followerId } });

    return { message: "Successfully unfollowed user" };
  }

  async getUserProfile(userId: string) {
    const user = await this.userModel.findById(userId)
      .select('username email avatarUrl role fieldFocus selfAssessedLevel gamification createdAt friends followers following')
      .populate('friends', 'username avatarUrl')
      .populate('followers', 'username avatarUrl')
      .populate('following', 'username avatarUrl');
    
    if (!user) throw new NotFoundException("User not found");
    return user;
  }
}
