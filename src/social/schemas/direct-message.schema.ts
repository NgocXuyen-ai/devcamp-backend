import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DirectMessageDocument = HydratedDocument<DirectMessage>;

@Schema({ timestamps: true })
export class DirectMessage {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  senderId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  receiverId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  body!: string;

  @Prop({ type: Boolean, default: false })
  read!: boolean;
}

export const DirectMessageSchema = SchemaFactory.createForClass(DirectMessage);

DirectMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
