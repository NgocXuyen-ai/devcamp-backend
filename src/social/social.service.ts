import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/users.schema';
import {
  FriendRequest,
  FriendRequestDocument,
} from './schemas/friend-request.schema';
import {
  DirectMessage,
  DirectMessageDocument,
} from './schemas/direct-message.schema';

const USER_FIELDS =
  'username avatarUrl email role fieldFocus selfAssessedLevel gamification createdAt';

@Injectable()
export class SocialService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(FriendRequest.name)
    private readonly friendRequestModel: Model<FriendRequestDocument>,
    @InjectModel(DirectMessage.name)
    private readonly dmModel: Model<DirectMessageDocument>,
  ) {}

  private toObjectId(id: string, label = 'User'): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`${label} not found`);
    }
    return new Types.ObjectId(id);
  }

  async getProfile(userId: string) {
    const user = await this.userModel
      .findById(this.toObjectId(userId))
      .select(USER_FIELDS)
      .populate({ path: 'friends', select: USER_FIELDS })
      .populate({ path: 'followers', select: USER_FIELDS })
      .populate({ path: 'following', select: USER_FIELDS })
      .lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async sendFriendRequest(currentUserId: Types.ObjectId, recipientId: string) {
    const recipient = this.toObjectId(recipientId);
    if (String(recipient) === String(currentUserId)) {
      throw new BadRequestException('Cannot send a friend request to yourself');
    }
    const recipientUser = await this.userModel.exists({ _id: recipient });
    if (!recipientUser) throw new NotFoundException('User not found');

    const alreadyFriends = await this.userModel.exists({
      _id: currentUserId,
      friends: recipient,
    });
    if (alreadyFriends) {
      throw new BadRequestException('You are already friends');
    }

    // Idempotent: reuse an existing request, resetting a rejected one to pending.
    const request = await this.friendRequestModel.findOneAndUpdate(
      { requesterId: currentUserId, recipientId: recipient },
      { $set: { status: 'pending' } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return request;
  }

  async getFriendRequests(currentUserId: Types.ObjectId) {
    return this.friendRequestModel
      .find({ recipientId: currentUserId, status: 'pending' })
      .sort({ createdAt: -1 })
      .populate({ path: 'requesterId', select: USER_FIELDS })
      .lean();
  }

  async acceptFriendRequest(
    currentUserId: Types.ObjectId,
    requesterId: string,
  ) {
    const requester = this.toObjectId(requesterId);
    const request = await this.friendRequestModel.findOne({
      requesterId: requester,
      recipientId: currentUserId,
      status: 'pending',
    });
    if (!request) throw new NotFoundException('Friend request not found');

    request.status = 'accepted';
    await request.save();

    await this.userModel.updateOne(
      { _id: currentUserId },
      { $addToSet: { friends: requester } },
    );
    await this.userModel.updateOne(
      { _id: requester },
      { $addToSet: { friends: currentUserId } },
    );
    return { success: true };
  }

  async rejectFriendRequest(
    currentUserId: Types.ObjectId,
    requesterId: string,
  ) {
    const requester = this.toObjectId(requesterId);
    const request = await this.friendRequestModel.findOneAndUpdate(
      {
        requesterId: requester,
        recipientId: currentUserId,
        status: 'pending',
      },
      { $set: { status: 'rejected' } },
      { new: true },
    );
    if (!request) throw new NotFoundException('Friend request not found');
    return { success: true };
  }

  async getFriends(currentUserId: Types.ObjectId) {
    const user = await this.userModel
      .findById(currentUserId)
      .select('friends')
      .populate({ path: 'friends', select: USER_FIELDS })
      .lean();
    return user?.friends ?? [];
  }

  async follow(currentUserId: Types.ObjectId, followingId: string) {
    const target = this.toObjectId(followingId);
    if (String(target) === String(currentUserId)) {
      throw new BadRequestException('Cannot follow yourself');
    }
    const exists = await this.userModel.exists({ _id: target });
    if (!exists) throw new NotFoundException('User not found');

    await this.userModel.updateOne(
      { _id: currentUserId },
      { $addToSet: { following: target } },
    );
    await this.userModel.updateOne(
      { _id: target },
      { $addToSet: { followers: currentUserId } },
    );
    return { success: true };
  }

  async unfollow(currentUserId: Types.ObjectId, followingId: string) {
    const target = this.toObjectId(followingId);
    await this.userModel.updateOne(
      { _id: currentUserId },
      { $pull: { following: target } },
    );
    await this.userModel.updateOne(
      { _id: target },
      { $pull: { followers: currentUserId } },
    );
    return { success: true };
  }

  async search(query: string, currentUserId: Types.ObjectId) {
    const q = (query ?? '').trim();
    if (!q) return [];
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.userModel
      .find({
        _id: { $ne: currentUserId },
        username: { $regex: escaped, $options: 'i' },
      })
      .select(USER_FIELDS)
      .limit(20)
      .lean();
  }

  async sendDirectMessage(
    senderId: Types.ObjectId,
    receiverId: string,
    body: string,
  ) {
    const receiver = this.toObjectId(receiverId);
    const exists = await this.userModel.exists({ _id: receiver });
    if (!exists) throw new NotFoundException('User not found');

    const created = await this.dmModel.create({
      senderId,
      receiverId: receiver,
      body,
    });
    const populated = await created.populate({
      path: 'senderId',
      select: USER_FIELDS,
    });
    return populated.toObject();
  }

  async getConversation(currentUserId: Types.ObjectId, otherUserId: string) {
    const other = this.toObjectId(otherUserId);
    const messages = await this.dmModel
      .find({
        $or: [
          { senderId: currentUserId, receiverId: other },
          { senderId: other, receiverId: currentUserId },
        ],
      })
      .sort({ createdAt: 1 })
      .populate({ path: 'senderId', select: USER_FIELDS })
      .lean();

    // Mark messages addressed to the current user as read.
    await this.dmModel.updateMany(
      { senderId: other, receiverId: currentUserId, read: false },
      { $set: { read: true } },
    );
    return messages;
  }
}
