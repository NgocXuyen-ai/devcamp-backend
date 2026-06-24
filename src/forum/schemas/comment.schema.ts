import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Reaction } from './post.schema';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  postId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author!: Types.ObjectId;

  @Prop({ type: String, required: true })
  body!: string;

  @Prop({ type: [Reaction], default: [] })
  reactions!: Reaction[];
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
