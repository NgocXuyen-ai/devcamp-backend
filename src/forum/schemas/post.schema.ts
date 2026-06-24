import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema({ _id: false })
export class Reaction {
  @Prop({ type: String, required: true })
  emoji!: string;

  @Prop({ type: Number, default: 1 })
  count!: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  users!: Types.ObjectId[];
}

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author!: Types.ObjectId;

  @Prop({ type: String, required: true })
  channelId!: string;

  @Prop({ type: String, required: true })
  body!: string;

  @Prop({ type: [Reaction], default: [] })
  reactions!: Reaction[];

  @Prop({ type: Number, default: 0 })
  replyCount!: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);
