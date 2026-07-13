import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { LoginAttemptResult } from '../../common/enums';

export type LoginAttemptDocument = HydratedDocument<LoginAttempt>;

/**
 * Login_Attempts_Log
 *
 * Drives the failed-login lock rule: after `auth.login.maxAttempts`
 * (default 5) failures within `auth.login.countWindowMinutes`, the account
 * is locked for `auth.login.lockMinutes` + a warning email + in-app
 * notification are sent. CAPTCHA gating was removed — `captchaRequired`/
 * `captchaPassed` below are kept as historical fields (old rows may still
 * have them set) but are no longer written to by new attempts.
 */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class LoginAttempt {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId; // có thể null nếu email không tồn tại

  @Prop({ type: String, required: true, lowercase: true })
  email!: string;

  @Prop({ type: String, enum: LoginAttemptResult, required: true })
  result!: LoginAttemptResult;

  @Prop({ type: String })
  ipAddress?: string;

  @Prop({ type: String })
  userAgent?: string;

  @Prop({ type: Boolean, default: false })
  captchaRequired!: boolean;

  @Prop({ type: Boolean, default: false })
  captchaPassed!: boolean;
}

export const LoginAttemptSchema = SchemaFactory.createForClass(LoginAttempt);

LoginAttemptSchema.index({ email: 1, createdAt: -1 });
LoginAttemptSchema.index({ userId: 1, createdAt: -1 });
// TTL — auto purge attempts older than 30 days
LoginAttemptSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 },
);