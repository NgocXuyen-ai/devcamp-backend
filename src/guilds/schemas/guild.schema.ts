import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GuildDocument = HydratedDocument<Guild>;

export const GUILD_TYPES = [
  'Backend',
  'Frontend',
  'Data Science',
  'DevOps',
  'Security',
  'Mobile',
] as const;

export type GuildType = (typeof GUILD_TYPES)[number];

@Schema({ _id: false })
export class GuildRequirement {
  @Prop({ required: true, trim: true })
  label!: string;

  @Prop({ required: true, trim: true })
  value!: string;
}

export const GuildRequirementSchema =
  SchemaFactory.createForClass(GuildRequirement);

@Schema({ _id: false })
export class GuildMemberHighlight {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  username!: string;

  @Prop({ trim: true })
  title?: string;

  @Prop({ trim: true })
  avatarUrl?: string;

  @Prop({ trim: true })
  initials?: string;

  @Prop({ type: Number, default: 0 })
  contributionXp!: number;

  @Prop({ trim: true })
  roleLabel?: string;

  @Prop({ type: Date, default: () => new Date() })
  joinedAt!: Date;
}

export const GuildMemberHighlightSchema =
  SchemaFactory.createForClass(GuildMemberHighlight);

@Schema({ _id: false })
export class GuildQuest {
  @Prop({ required: true, trim: true })
  questId!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ required: true, trim: true })
  category!: string;

  @Prop({ required: true, trim: true })
  difficulty!: string;

  @Prop({ type: Number, required: true, min: 0 })
  progress!: number;

  @Prop({ type: Number, required: true, min: 1 })
  total!: number;

  @Prop({ type: Number, required: true, min: 0 })
  rewardXp!: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  rewardCoins!: number;

  @Prop({ type: Number, min: 1, default: 7 })
  dueInDays!: number;
}

export const GuildQuestSchema = SchemaFactory.createForClass(GuildQuest);

@Schema({ _id: false })
export class GuildQuestClaim {
  @Prop({ required: true, trim: true })
  questId!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Date, default: () => new Date() })
  claimedAt!: Date;
}

export const GuildQuestClaimSchema =
  SchemaFactory.createForClass(GuildQuestClaim);

@Schema({ _id: false })
export class GuildActivity {
  @Prop({ required: true, trim: true })
  type!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ type: Date, default: () => new Date() })
  createdAt!: Date;
}

export const GuildActivitySchema = SchemaFactory.createForClass(GuildActivity);

@Schema({ timestamps: true })
export class Guild {
  @Prop({ required: true, trim: true, unique: true })
  slug!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true, enum: GUILD_TYPES })
  type!: GuildType;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ trim: true })
  mission?: string;

  @Prop({ trim: true })
  language?: string;

  @Prop({ trim: true })
  headquarters?: string;

  @Prop({ trim: true })
  recruitmentPitch?: string;

  @Prop({ trim: true })
  color!: string;

  @Prop({ type: Number, default: 1 })
  rank!: number;

  @Prop({ type: Number, default: 1 })
  level!: number;

  @Prop({ type: Number, default: 0 })
  xp!: number;

  @Prop({ type: Number, default: 10000 })
  xpNext!: number;

  @Prop({ type: Number, default: 0 })
  weeklyXP!: number;

  @Prop({ type: Number, default: 0 })
  winRate!: number;

  @Prop({ type: Number, default: 1 })
  memberCount!: number;

  @Prop({ type: Number, default: 50 })
  maxMembers!: number;

  @Prop({ type: String })
  founded!: string;

  @Prop({ type: Boolean, default: true })
  openToJoin!: boolean;

  @Prop({ type: Boolean, default: false })
  featured!: boolean;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: [GuildRequirementSchema], default: [] })
  requirements!: GuildRequirement[];

  @Prop({ type: [String], default: [] })
  perks!: string[];

  @Prop({ type: [GuildQuestSchema], default: [] })
  quests!: GuildQuest[];

  @Prop({ type: [GuildQuestClaimSchema], default: [] })
  questClaims!: GuildQuestClaim[];

  @Prop({ type: [GuildActivitySchema], default: [] })
  activityFeed!: GuildActivity[];

  @Prop({ type: [GuildMemberHighlightSchema], default: [] })
  featuredMembers!: GuildMemberHighlight[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  memberIds!: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  ownerId?: Types.ObjectId;
}

export const GuildSchema = SchemaFactory.createForClass(Guild);

GuildSchema.index({ slug: 1 }, { unique: true });
GuildSchema.index({ type: 1, rank: 1 });
