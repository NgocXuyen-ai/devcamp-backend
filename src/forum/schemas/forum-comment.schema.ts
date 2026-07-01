import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Reaction, ReactionSchema } from './reaction.schema';

export type ForumCommentDocument = HydratedDocument<ForumComment>;

@Schema({ timestamps: true })
export class ForumComment {
  @Prop({ type: Types.ObjectId, ref: 'ForumPost', required: true })
  postId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId!: Types.ObjectId;

  @Prop({ required: true })
  body!: string;

  @Prop({ type: [ReactionSchema], default: [] })
  reactions!: Reaction[];
}

export const ForumCommentSchema = SchemaFactory.createForClass(ForumComment);
