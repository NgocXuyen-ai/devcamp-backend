import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

/** Emoji reaction shared by forum posts and comments. */
@Schema({ _id: false })
export class Reaction {
  @Prop({ type: String, required: true })
  emoji!: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  users!: Types.ObjectId[];
}

export const ReactionSchema = SchemaFactory.createForClass(Reaction);
