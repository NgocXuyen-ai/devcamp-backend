import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { HistoryAction } from '../../common/enums';

export type LearningHistoryDocument = HydratedDocument<LearningHistory>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class LearningHistory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: HistoryAction, required: true })
  action!: HistoryAction;

  @Prop({ type: Types.ObjectId, ref: 'RoadmapNode' })
  nodeId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Question' })
  questionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Exercise' })
  exerciseId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Battle' })
  battleId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Submission' })
  submissionId?: Types.ObjectId;

  @Prop({ type: Number })
  score?: number;

  @Prop({ type: Number })
  xpEarned?: number;

  @Prop({ type: Number })
  coinsEarned?: number;

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, unknown>;
}

export const LearningHistorySchema =
  SchemaFactory.createForClass(LearningHistory);

LearningHistorySchema.index({ userId: 1, createdAt: -1 });
LearningHistorySchema.index({ userId: 1, action: 1, createdAt: -1 });
