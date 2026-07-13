import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  BattleMode,
  BattleResult,
  BattleStatus,
  CareerField,
} from '../../common/enums';

export type BattleDocument = HydratedDocument<Battle>;

@Schema({ _id: false })
export class BattlePlayer {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String })
  username?: string;

  @Prop({ type: String })
  avatar?: string;

  @Prop({ type: Number, default: 1000 })
  ratingBefore!: number;

  @Prop({ type: Number })
  ratingAfter?: number; // computed when battle ends

  @Prop({ type: Number, default: 0 })
  score!: number; // points earned in this battle

  @Prop({ type: Number, default: 0 })
  passedTestCount!: number;

  @Prop({ type: Number })
  finishTimeSeconds?: number;

  @Prop({ type: Number, default: 0 })
  submissionCount!: number;

  @Prop({ type: String, enum: BattleResult })
  result?: BattleResult;
}

/**
 * BATTLES — 1v1 coding match.
 *
 * Matching criteria (from survey):
 *   - 88.2% — cùng Rank
 *   - 76.5% — cùng lĩnh vực (FE vs FE)
 *
 * Modes:
 *   - PERFORMANCE: tổng hợp 2-3 bài, thiên về thuật toán
 *   - SPEED: 1 bài, tốc độ tuyệt đối
 */
@Schema({ timestamps: true })
export class Battle {
  @Prop({ type: String, enum: BattleMode, required: true })
  mode!: BattleMode;

  @Prop({ type: String, enum: CareerField, required: true })
  field!: CareerField;

  @Prop({ type: String, enum: BattleStatus, default: BattleStatus.WAITING })
  status!: BattleStatus;

  @Prop({ type: [BattlePlayer], default: [] })
  players!: BattlePlayer[];

  @Prop({ type: [Types.ObjectId], ref: 'Question', default: [] })
  questionIds!: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  winnerId?: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  isDraw!: boolean;

  @Prop({ type: Date })
  startTime?: Date;

  @Prop({ type: Date })
  endTime?: Date;

  @Prop({ type: Date })
  expectedEndTime?: Date;

  /** Max duration (giây) trước khi tự huỷ */
  @Prop({ type: Number, default: 1800 })
  timeLimitSeconds!: number;

  /** Min/Max ELO gap for matching */
  @Prop({ type: Number, default: 200 })
  matchingEloRange!: number;

  /** Liên kết tới Milestone Gate nếu battle này để mở khoá milestone */
  @Prop({ type: Types.ObjectId, ref: 'RoadmapNode' })
  gatedNodeId?: Types.ObjectId;
}

export const BattleSchema = SchemaFactory.createForClass(Battle);

BattleSchema.index({ status: 1, mode: 1, field: 1 });
BattleSchema.index({ 'players.userId': 1, createdAt: -1 });
BattleSchema.index({ winnerId: 1 });
