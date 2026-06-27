import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Reaction, ReactionSchema } from './reaction.schema';

export type ForumCommentDocument = HydratedDocument<ForumComment>;

@Schema({ timestamps: true })
export class ForumComment {
  @Prop({ type: Types.ObjectId, ref: 'ForumPost', required: true, index: true })
  postId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  body!: string;

  @Prop({ type: [ReactionSchema], default: [] })
  reactions!: Reaction[];
}

export const ForumCommentSchema = SchemaFactory.createForClass(ForumComment);
