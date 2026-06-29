import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AIMessageRole } from '../../common/enums';

export type AiChatMessageDocument = HydratedDocument<AiChatMessage>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AiChatMessage {
  @Prop({ type: Types.ObjectId, ref: 'AiChatSession', required: true })
  sessionId!: Types.ObjectId;

  @Prop({ type: String, enum: AIMessageRole, required: true })
  role!: AIMessageRole;

  @Prop({ type: String, required: true })
  content!: string;

  @Prop({ type: Number, default: 0 })
  tokenUsed!: number;

  /** If user triggered the hint by a wrong submission */
  @Prop({ type: Types.ObjectId, ref: 'Submission' })
  triggeredBySubmissionId?: Types.ObjectId;

  /** Loại hint AI gửi ra: 'question' | 'hint' | 'concept' | 'code' */
  @Prop({ type: String })
  hintType?: string;

  @Prop({ type: Number })
  hintLevel?: number; // step-by-step: 1, 2, 3, ...

  /** User feedback on this message */
  @Prop({ type: Number, default: 0 })
  feedbackScore!: number; // -1 (thumb down) / 0 / 1 (thumb up)
}

export const AiChatMessageSchema = SchemaFactory.createForClass(AiChatMessage);

AiChatMessageSchema.index({ sessionId: 1, createdAt: 1 });
