import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import {
  LoginAttemptResult,
  LoginProvider,
  OtpPurpose,
  UserRole,
} from '../../common/enums';
import { UserDocument } from '../../users/schemas/users.schema';
import { UsersService } from '../../users/service/users.service';
import { LoginAttemptService } from '../../users/service/login-attempt.service';
import { RegisterDto } from '../dto/register.dto';
import {
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from '../dto/auth.request.dto';
import {
  RefreshToken,
  RefreshTokenDocument,
} from '../schemas/refresh-token.schema';
import { MailService } from './mail.service';
import { OtpService } from './otp.service';
import { PasswordService } from './password.service';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  username: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: string;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly attempts: LoginAttemptService,
    private readonly otpService: OtpService,
    private readonly passwords: PasswordService,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  // ===== Registration =====

  async register(dto: RegisterDto): Promise<UserDocument> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Confirm password must match password');
    }
    const hashed = await this.passwords.hash(dto.password);
    const user = await this.users.create({
      username: dto.username,
      email: dto.email,
      password: hashed,
      provider: LoginProvider.EMAIL,
    });
    // Fire-and-forget welcome email
    this.mail
      .sendWelcomeEmail(user.email, user.username)
      .catch(() => undefined);
    return user;
  }

  async loginWithPassword(
    dto: LoginDto,
    context: { ip?: string; ua?: string },
  ): Promise<{ user: UserDocument; tokens: TokenPair }> {
    const email = dto.email.toLowerCase();

    // 1. Hard lock check
    if (await this.attempts.shouldLockAccount(email)) {
      throw new ForbiddenException({
        message:
          'Account temporarily locked due to too many failed login attempts. Please try again in 15 minutes.',
        code: 'ACCOUNT_LOCKED',
      });
    }

    // 2. CAPTCHA requirement
    const needCaptcha = await this.attempts.shouldRequireCaptcha(email);
    if (needCaptcha && !dto.captchaToken) {
      throw new BadRequestException({
        message: 'CAPTCHA verification required',
        code: 'CAPTCHA_REQUIRED',
      });
    }
    // TODO: validate captchaToken with the CAPTCHA provider here.

    // 3. Load user (with password)
    const user = await this.users.findByEmail(email);
    if (user?.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException({
        message:
          'Account temporarily locked due to too many failed login attempts. Please try again later.',
        code: 'ACCOUNT_LOCKED',
      });
    }
    if (!user || !user.password) {
      await this.attempts.record({
        email,
        result: LoginAttemptResult.USER_NOT_FOUND,
        ipAddress: context.ip,
        userAgent: context.ua,
        captchaRequired: needCaptcha,
        captchaPassed: needCaptcha && !!dto.captchaToken,
      });
      throw new UnauthorizedException({
        message: 'Incorrect email or password.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // 4. Check password
    const ok = await this.passwords.compare(dto.password, user.password);
    if (!ok) {
      await this.attempts.record({
        email,
        userId: user._id,
        result: LoginAttemptResult.WRONG_PASSWORD,
        ipAddress: context.ip,
        userAgent: context.ua,
        captchaRequired: needCaptcha,
        captchaPassed: needCaptcha && !!dto.captchaToken,
      });
      await this.users.incrementFailedLogin(user._id);

      // If this failure just crossed the lock threshold, send warning email
      if (await this.attempts.shouldLockAccount(email)) {
        const until = new Date(
          Date.now() +
            this.config.get<number>('auth.login.lockMinutes', 15) * 60_000,
        );
        await this.users.lockAccount(user._id, until);
        this.mail.sendSuspiciousLoginEmail(user.email).catch(() => undefined);
      }

      throw new UnauthorizedException({
        message: 'Incorrect email or password.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // 5. Success
    await this.attempts.record({
      email,
      userId: user._id,
      result: LoginAttemptResult.SUCCESS,
      ipAddress: context.ip,
      userAgent: context.ua,
    });
    await this.attempts.clearFor(email);
    await this.users.setLastLogin(user._id);
    await this.users.unlockAccount(user._id);

    const tokens = await this.issueTokenPair(user, context);
    return { user, tokens };
  }

  async loginOrCreateFromOAuth(params: {
    provider: LoginProvider;
    providerId: string;
    email: string;
    username: string;
    avatarUrl?: string;
  }): Promise<{ user: UserDocument; tokens: TokenPair; isNewUser: boolean }> {
    let user = await this.users.findByProvider(
      params.provider,
      params.providerId,
    );
    let isNewUser = false;
    if (!user) {
      const baseUsername = params.username.replace(/[^a-zA-Z0-9_]/g, '');
      let username = baseUsername;
      while (await this.users.findByUsername(username)) {
        username = `${baseUsername}_${randomBytes(2).toString('hex')}`;
      }
      user = await this.users.create({
        username,
        email: params.email,
        provider: params.provider,
        providerId: params.providerId,
        avatarUrl: params.avatarUrl,
        emailVerified: true,
      });
      isNewUser = true;
    }
    await this.users.setLastLogin(user._id);
    const tokens = await this.issueTokenPair(user, {});
    return { user, tokens, isNewUser };
  }

  async issueTokenPair(
    user: UserDocument,
    context: { ip?: string; ua?: string },
  ): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessExpires = this.config.get<string>(
      'auth.jwt.accessExpires',
      '15m',
    );
    const accessToken = this.jwt.sign(
      { ...payload },
      {
        secret: this.config.get<string>('auth.jwt.accessSecret'),
        expiresIn: accessExpires as JwtSignOptions['expiresIn'],
      },
    );

    const refreshToken = randomBytes(48).toString('hex');
    const refreshExpiresIn = this.config.get<string>(
      'auth.jwt.refreshExpires',
      '7d',
    );
    const expiresAt = new Date(
      Date.now() + this.parseDurationMs(refreshExpiresIn),
    );

    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash: sha256(refreshToken),
      expiresAt,
      ipAddress: context.ip,
      userAgent: context.ua,
    });

    return {
      accessToken,
      refreshToken,
      accessExpiresIn:
        this.config.get<string>('auth.jwt.accessExpires') ?? '15m',
    };
  }

  async refresh(
    refreshToken: string,
    context: { ip?: string; ua?: string },
  ): Promise<TokenPair> {
    const hash = sha256(refreshToken);
    const token = await this.refreshTokenModel.findOne({ tokenHash: hash });
    if (!token || token.revoked || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    const user = await this.users.findById(token.userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    const newPair = await this.issueTokenPair(user, context);
    token.revoked = true;
    token.revokedAt = new Date();
    token.replacedByTokenHash = sha256(newPair.refreshToken);
    await token.save();
    return newPair;
  }

  async logout(refreshToken: string): Promise<void> {
    const hash = sha256(refreshToken);
    await this.refreshTokenModel.updateOne(
      { tokenHash: hash, revoked: false },
      { $set: { revoked: true, revokedAt: new Date() } },
    );
  }

  async logoutAll(userId: Types.ObjectId): Promise<void> {
    await this.refreshTokenModel.updateMany(
      { userId, revoked: false },
      { $set: { revoked: true, revokedAt: new Date() } },
    );
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ sent: true }> {
    const user = await this.users.findByEmail(dto.email);
    // Always return success to avoid enumeration
    if (!user) return { sent: true };

    const code = await this.otpService.generate(
      user.email,
      OtpPurpose.PASSWORD_RESET,
    );
    await this.mail.sendOtpEmail(user.email, code).catch(() => undefined);
    return { sent: true };
  }

  /**
   * Verify OTP, return a short-lived reset token the frontend must send
   * back when calling /auth/reset-password.
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<{ resetToken: string }> {
    await this.otpService.verify(
      dto.email,
      dto.code,
      OtpPurpose.PASSWORD_RESET,
    );
    const resetToken = this.jwt.sign(
      { email: dto.email.toLowerCase(), purpose: 'password_reset' },
      {
        secret: this.config.get<string>('auth.jwt.accessSecret'),
        expiresIn: '15m',
      },
    );
    return { resetToken };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ success: true }> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Confirm password must match');
    }
    let payload: { email: string; purpose: string };
    try {
      payload = this.jwt.verify(dto.resetToken, {
        secret: this.config.get<string>('auth.jwt.accessSecret'),
      });
    } catch {
      throw new UnauthorizedException('Reset token invalid or expired');
    }
    if (
      payload.purpose !== 'password_reset' ||
      payload.email !== dto.email.toLowerCase()
    ) {
      throw new UnauthorizedException('Reset token does not match this email');
    }

    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('User not found');

    const hashed = await this.passwords.hash(dto.newPassword);
    await this.users.setPassword(user._id, hashed);
    // Force-logout all sessions after password change
    await this.logoutAll(user._id);
    return { success: true };
  }

  // ===== helpers =====

  /** Accepts strings like "15m", "7d", "30s", "2h". Returns ms. */
  private parseDurationMs(input: string): number {
    const match = /^(\d+)([smhd])$/.exec(input.trim());
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multiplier =
      unit === 's'
        ? 1000
        : unit === 'm'
          ? 60_000
          : unit === 'h'
            ? 3_600_000
            : 86_400_000;
    return value * multiplier;
  }
}
