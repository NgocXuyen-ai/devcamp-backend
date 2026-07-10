import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AIMentorStyle, AIMentorTone } from '../../common/enums';

export type AiChatSessionDocument = HydratedDocument<AiChatSession>;

@Schema({ timestamps: true })
export class AiChatSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  /** Linked context — what is the user working on right now */
  @Prop({ type: Types.ObjectId, ref: 'RoadmapNode' })
  nodeId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Question' })
  questionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Exercise' })
  exerciseId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Battle' })
  battleId?: Types.ObjectId;

  @Prop({ type: String })
  contextSummary?: string;

  @Prop({ type: String, enum: AIMentorStyle, default: AIMentorStyle.INDIRECT })
  style!: AIMentorStyle;

  @Prop({ type: String, enum: AIMentorTone, default: AIMentorTone.FRIENDLY })
  tone!: AIMentorTone;

  @Prop({ type: String, default: 'gpt-4' })
  model!: string;

  @Prop({ type: Number, default: 0 })
  totalTokensUsed!: number;

  @Prop({ type: Number, default: 0 })
  messageCount!: number;

  @Prop({ type: Boolean, default: false })
  isClosed!: boolean;

  @Prop({ type: String })
  title?: string; // summary of conversation
}

export const AiChatSessionSchema = SchemaFactory.createForClass(AiChatSession);

AiChatSessionSchema.index({ userId: 1, createdAt: -1 });
AiChatSessionSchema.index({ userId: 1, nodeId: 1 });
AiChatSessionSchema.index({ userId: 1, battleId: 1 });
