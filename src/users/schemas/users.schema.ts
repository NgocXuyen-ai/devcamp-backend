import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  CareerField,
  DisciplineLevel,
  LoginProvider,
  SkillLevel,
  UserRole,
} from '../../common/enums';

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class UserPreferences {
  @Prop({ type: Number, default: 2 })
  dailyStudyHours!: number; // số giờ học/ngày

  @Prop({ type: String, default: '20:00-22:00' })
  focusTimeWindow!: string; // khung giờ tập trung

  @Prop({ type: String, enum: DisciplineLevel, default: DisciplineLevel.LIGHT })
  disciplineLevel!: DisciplineLevel;

  @Prop({ type: Number, default: 5 })
  maxSubmitAttempts!: number; // 10 (Light) hay 5 (Strict)

  @Prop({ type: Number, default: 30 })
  lockTimeMinutes!: number; // 15 hay 30 phút

  @Prop({ type: String, default: 'project' }) // 'battle' | 'project'
  milestoneTestPreference!: string;
}

@Schema({ _id: false })
export class UserGamification {
  @Prop({ type: Number, default: 0 })
  xp!: number;

  @Prop({ type: Number, default: 1 })
  level!: number;

  @Prop({ type: Number, default: 0 })
  coins!: number;

  @Prop({ type: Number, default: 0 })
  currentStreak!: number; // chuỗi ngày học liên tiếp

  @Prop({ type: Number, default: 0 })
  longestStreak!: number;

  @Prop({ type: Date })
  lastActiveDate?: Date;

  @Prop({ type: Date })
  lastDailyClaimAt?: Date;

  @Prop({ type: [String], default: [] })
  badges!: string[]; // ['founders_mantle', 'first_blood', ...]
}

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true, unique: true, trim: true })
  username!: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({ type: String, required: false, select: false })
  password?: string; // optional — social login users may not have one

  @Prop({ type: String, enum: LoginProvider, default: LoginProvider.EMAIL })
  provider!: LoginProvider;

  @Prop({ type: String })
  providerId?: string; // Google/GitHub sub id

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Prop({ type: String })
  avatarUrl?: string;

  @Prop({ type: Boolean, default: true })
  isFirstLogin!: boolean; // true → bật onboarding survey

  @Prop({ type: Boolean, default: false })
  emailVerified!: boolean;

  @Prop({ type: Boolean, default: false })
  isLocked!: boolean; // tài khoản bị khoá tạm (sai password >5)

  @Prop({ type: Date })
  lockedUntil?: Date;

  @Prop({ type: Number, default: 0 })
  failedLoginCount!: number;

  // === Survey results ===
  @Prop({ type: String, enum: CareerField })
  fieldFocus?: CareerField; // FE/BE/Fullstack

  @Prop({ type: String, enum: SkillLevel })
  selfAssessedLevel?: SkillLevel;

  @Prop({ type: String })
  learningGoal?: string; // "get a job" / "build projects" / ...

  @Prop({ type: [String], default: [] })
  knownLanguages!: string[]; // Python, JavaScript, Java...

  @Prop({ type: [String], default: [] })
  weaknesses!: string[]; // các chủ đề yếu rút ra từ test

  @Prop({ type: [String], default: [] })
  strengths!: string[];

  // === Preferences (penalty config, study schedule) ===
  @Prop({ type: UserPreferences, default: () => ({}) })
  preferences!: UserPreferences;

  // === Gamification state ===
  @Prop({ type: UserGamification, default: () => ({}) })
  gamification!: UserGamification;

  // === Current roadmap reference ===
  @Prop({ type: Types.ObjectId, ref: 'Roadmap' })
  currentRoadmapId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RoadmapNode' })
  currentNodeId?: Types.ObjectId; // node đang học dở

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  friends!: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  followers!: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  following!: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ provider: 1, providerId: 1 });
