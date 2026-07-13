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
  dailyStudyHours!: number;

  @Prop({ type: String, default: '20:00-22:00' })
  focusTimeWindow!: string;

  @Prop({ type: String, enum: DisciplineLevel, default: DisciplineLevel.LIGHT })
  disciplineLevel!: DisciplineLevel;

  @Prop({ type: Number, default: 5 })
  maxSubmitAttempts!: number;

  @Prop({ type: Number, default: 30 })
  lockTimeMinutes!: number;

  @Prop({ type: String, default: 'project' })
  milestoneTestPreference!: string;
}

@Schema({ _id: false })
export class UserSocialLinks {
  // Username thô (không phải URL đầy đủ) — FE tự build link dạng
  // https://github.com/<github>, tương tự các trang profile khác.
  @Prop({ type: String, trim: true, maxlength: 39 })
  github?: string;

  @Prop({ type: String, trim: true, maxlength: 39 })
  linkedin?: string;

  @Prop({ type: String, trim: true, maxlength: 15 })
  twitter?: string;

  // Đây mới thực sự là URL đầy đủ (blog/portfolio cá nhân).
  @Prop({ type: String, trim: true, maxlength: 200 })
  website?: string;
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
  currentStreak!: number;

  @Prop({ type: Number, default: 0 })
  longestStreak!: number;

  @Prop({ type: Date })
  lastActiveDate?: Date;

  @Prop({ type: Date })
  lastDailyClaimAt?: Date;

  @Prop({ type: [String], default: [] })
  badges!: string[];

  // === Shop item effects ===
  @Prop({ type: Date })
  xpBoostExpiresAt?: Date; // XP x2 còn active nếu > now

  @Prop({ type: Number, default: 0 })
  bonusSubmitAttempts!: number; // Lượt submit thêm từ shop
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
  password?: string;

  @Prop({ type: String, enum: LoginProvider, default: LoginProvider.EMAIL })
  provider!: LoginProvider;

  @Prop({ type: String })
  providerId?: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Prop({ type: String })
  avatarUrl?: string;

  // === Public profile ===
  @Prop({ type: String, trim: true, maxlength: 160 })
  bio?: string;

  @Prop({ type: String, trim: true, maxlength: 80 })
  location?: string;

  @Prop({ type: UserSocialLinks, default: () => ({}) })
  socialLinks!: UserSocialLinks;

  @Prop({ type: Boolean, default: true })
  showProfile!: boolean;

  @Prop({ type: Boolean, default: true })
  showCertificates!: boolean;

  @Prop({ type: Boolean, default: true })
  isFirstLogin!: boolean;

  @Prop({ type: Boolean, default: false })
  emailVerified!: boolean;

  @Prop({ type: Boolean, default: false })
  isLocked!: boolean;

  @Prop({ type: Date })
  lockedUntil?: Date;

  @Prop({ type: Number, default: 0 })
  failedLoginCount!: number;

  // === Survey results ===
  @Prop({ type: String, enum: CareerField })
  fieldFocus?: CareerField;

  @Prop({ type: String, enum: SkillLevel })
  selfAssessedLevel?: SkillLevel;

  @Prop({ type: String })
  learningGoal?: string;

  @Prop({ type: [String], default: [] })
  knownLanguages!: string[];

  @Prop({ type: [String], default: [] })
  weaknesses!: string[];

  @Prop({ type: [String], default: [] })
  strengths!: string[];

  @Prop({ type: UserPreferences, default: () => ({}) })
  preferences!: UserPreferences;

  @Prop({ type: UserGamification, default: () => ({}) })
  gamification!: UserGamification;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  friends!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  followers!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  following!: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Roadmap' })
  currentRoadmapId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RoadmapNode' })
  currentNodeId?: Types.ObjectId;

  @Prop({ type: Date })
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ provider: 1, providerId: 1 });
