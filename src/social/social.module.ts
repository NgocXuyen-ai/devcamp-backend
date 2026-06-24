import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { FriendRequest, FriendRequestSchema } from './schemas/friend-request.schema';
import { User, UserSchema } from '../users/schemas/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FriendRequest.name, schema: FriendRequestSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SocialController],
  providers: [SocialService],
})
export class SocialModule {}
