import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/users.schema';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import {
  FriendRequest,
  FriendRequestSchema,
} from './schemas/friend-request.schema';
import {
  DirectMessage,
  DirectMessageSchema,
} from './schemas/direct-message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: FriendRequest.name, schema: FriendRequestSchema },
      { name: DirectMessage.name, schema: DirectMessageSchema },
    ]),
  ],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
