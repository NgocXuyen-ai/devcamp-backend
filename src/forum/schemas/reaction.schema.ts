import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ _id: false })
export class Reaction {
  @Prop({ required: true })
  emoji!: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  users!: Types.ObjectId[];
}

export const ReactionSchema = SchemaFactory.createForClass(Reaction);
