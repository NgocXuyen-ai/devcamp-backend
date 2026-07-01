import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Reaction, ReactionSchema } from './reaction.schema';

export type ForumPostDocument = HydratedDocument<ForumPost>;

@Schema({ timestamps: true })
export class ForumPost {
  @Prop({ required: true })
  channelId!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId!: Types.ObjectId;

  @Prop({ required: true })
  body!: string;

  @Prop({ type: [ReactionSchema], default: [] })
  reactions!: Reaction[];

  @Prop({ type: Number, default: 0 })
  replyCount!: number;
}

export const ForumPostSchema = SchemaFactory.createForClass(ForumPost);
