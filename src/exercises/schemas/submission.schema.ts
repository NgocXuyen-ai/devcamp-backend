import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { QuestionDifficulty, SubmissionStatus } from '../../common/enums';

export type SubmissionDocument = HydratedDocument<Submission>;

@Schema({ _id: false })
export class TestCaseResult {
  @Prop({ type: Number, required: true })
  index!: number;

  @Prop({ type: Boolean, required: true })
  passed!: boolean;

  @Prop({ type: String })
  actualOutput?: string;

  @Prop({ type: String })
  expectedOutput?: string;

  @Prop({ type: Number })
  runtimeMs?: number;

  @Prop({ type: Number })
  memoryKb?: number;

  @Prop({ type: String })
  errorMessage?: string;
}

/**
 * Submission — one row per code submit.
 *
 * Powers:
 *   - Penalty logic (count submissions per node, lock after N)
 *   - History page ("Bài đã hoàn thành")
 *   - Error tracking (build AggregatedError from failed submissions)
 *   - Battle scoring
 */
@Schema({ timestamps: true })
export class Submission {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  practiceId!: string;

  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: true })
  topic!: string;

  @Prop({ type: String, required: true })
  track!: string;

  @Prop({ type: String, enum: QuestionDifficulty })
  difficulty?: QuestionDifficulty;

  /** Either a Question OR an Exercise — track separately */
  @Prop({ type: Types.ObjectId, ref: 'Question' })
  questionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Exercise' })
  exerciseId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RoadmapNode' })
  nodeId?: Types.ObjectId;

  /** If this submission was made inside a battle, link it */
  @Prop({ type: Types.ObjectId, ref: 'Battle' })
  battleId?: Types.ObjectId;

  @Prop({ type: String, required: true })
  language!: string;

  @Prop({ type: String, required: true })
  code!: string;

  @Prop({ type: String, enum: SubmissionStatus, required: true })
  status!: SubmissionStatus;

  @Prop({ type: Number, default: 0 })
  score!: number; // 0-100

  @Prop({ type: Number, default: 0 })
  passedTestCount!: number;

  @Prop({ type: Number, default: 0 })
  totalTestCount!: number;

  @Prop({ type: [TestCaseResult], default: [] })
  testResults!: TestCaseResult[];

  @Prop({ type: Number })
  runtimeMs?: number;

  @Prop({ type: Number })
  memoryKb?: number;

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: String })
  compilerError?: string;

  /** Attempt number for this (user, question/exercise) pair */
  @Prop({ type: Number, default: 1 })
  attemptNumber!: number;

  /** Whether this submission triggered a penalty action */
  @Prop({ type: Boolean, default: false })
  triggeredPenalty!: boolean;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);

SubmissionSchema.index({ userId: 1, createdAt: -1 });
SubmissionSchema.index({ practiceId: 1, createdAt: -1 });
SubmissionSchema.index({ userId: 1, questionId: 1 });
SubmissionSchema.index({ userId: 1, exerciseId: 1 });
SubmissionSchema.index({ userId: 1, nodeId: 1 });
SubmissionSchema.index({ battleId: 1, userId: 1 });
