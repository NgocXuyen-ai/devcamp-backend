import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  CareerField,
  DisciplineLevel,
  LessonLevel,
  SkillLevel,
} from '../../common/enums';

export type SurveyResponseDocument = HydratedDocument<SurveyResponse>;

@Schema({ _id: false })
export class TechnicalTestAnswer {
  @Prop({ type: Types.ObjectId, ref: 'Question', required: true })
  questionId!: Types.ObjectId;

  /** User's submitted JavaScript code */
  @Prop({ type: String })
  submittedCode?: string;

  @Prop({ type: Number, default: 0 })
  passedTestCases!: number;

  @Prop({ type: Number, default: 0 })
  totalTestCases!: number;

  /** Passed all test cases */
  @Prop({ type: Boolean, default: false })
  isCorrect!: boolean;

  /** First syntax/runtime/timeout error, if any */
  @Prop({ type: String })
  errorMessage?: string;

  @Prop({ type: Number })
  timeSpentSeconds?: number;
}

/**
 * SurveyResponse — Onboarding adaptive survey result.
 *
 * Captures the three survey segments from page 15-16:
 *   1. Career Path
 *   2. Skill Assessment (Self + Quick Test)
 *   3. Discipline & Penalty Setup
 *
 * Output drives:
 *   - User.fieldFocus / preferences / weaknesses
 *   - Roadmap selection (Mapping Path)
 *   - Initial Entry Point on the skill tree
 */
@Schema({ timestamps: true })
export class SurveyResponse {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  // === Segment 1: Career Path ===
  @Prop({ type: String, enum: CareerField, required: true })
  fieldFocus!: CareerField;

  @Prop({ type: String })
  learningGoal?: string; // 'get_job' | 'personal_project' | 'competition' | 'explore_ai'

  // === Segment 2: Skill Assessment ===
  @Prop({ type: String, enum: SkillLevel })
  selfAssessedLevel?: SkillLevel;

  @Prop({ type: [String], default: [] })
  knownLanguages!: string[];

  @Prop({ type: [TechnicalTestAnswer], default: [] })
  technicalTestAnswers!: TechnicalTestAnswer[];

  /** (passed test cases / total test cases) * 100 */
  @Prop({ type: Number, default: 0 })
  technicalTestScore!: number;

  @Prop({ type: Number })
  technicalTestTimeSeconds?: number;

  /** Suggested entry point computed from test score */
  @Prop({ type: String, enum: LessonLevel })
  computedEntryLevel?: LessonLevel;

  // === Segment 3: Discipline & Penalty ===
  @Prop({ type: Number, default: 2 })
  dailyHours!: number;

  @Prop({ type: String, default: '20:00-22:00' })
  focusTimeWindow!: string;

  @Prop({ type: String, default: 'project' })
  milestoneTestPreference!: string; // 'battle' | 'project'

  @Prop({ type: String, enum: DisciplineLevel, default: DisciplineLevel.LIGHT })
  disciplineLevel!: DisciplineLevel;

  // === Raw answers (free-form, for analytics) ===
  @Prop({ type: Object, default: {} })
  rawAnswers!: Record<string, unknown>;

  @Prop({ type: Boolean, default: false })
  isCompleted!: boolean;

  @Prop({ type: Date })
  completedAt?: Date;

  /** Whether the user retook the assessment (survey: 58.8% want monthly) */
  @Prop({ type: Number, default: 1 })
  version!: number;
}

export const SurveyResponseSchema =
  SchemaFactory.createForClass(SurveyResponse);

SurveyResponseSchema.index({ userId: 1, createdAt: -1 });
SurveyResponseSchema.index({ userId: 1, version: -1 });
