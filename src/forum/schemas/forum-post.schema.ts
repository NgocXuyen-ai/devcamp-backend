import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Reaction, ReactionSchema } from './reaction.schema';

export type ForumPostDocument = HydratedDocument<ForumPost>;

@Schema({ timestamps: true })
export class ForumPost {
  @Prop({ type: String, required: true, index: true })
  channelId!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  body!: string;

  @Prop({ type: [ReactionSchema], default: [] })
  reactions!: Reaction[];

  @Prop({ type: Number, default: 0 })
  replyCount!: number;
}

export const ForumPostSchema = SchemaFactory.createForClass(ForumPost);
