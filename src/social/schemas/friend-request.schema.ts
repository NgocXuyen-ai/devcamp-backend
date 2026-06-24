import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FriendRequestDocument = HydratedDocument<FriendRequest>;

@Schema({ timestamps: true })
export class FriendRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requesterId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipientId!: Types.ObjectId;

  @Prop({ type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' })
  status!: string;
}

export const FriendRequestSchema = SchemaFactory.createForClass(FriendRequest);
FriendRequestSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });
