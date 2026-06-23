import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomInt } from 'crypto';
import { Model } from 'mongoose';
import { OtpPurpose } from '../../common/enums';
import { Otp, OtpDocument } from '../schemas/otp.schema';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class OtpService {
  constructor(
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
    private readonly config: ConfigService,
  ) {}

  async generate(email: string, purpose: OtpPurpose): Promise<string> {
    const minutes = this.config.get<number>('auth.otp.expiresMinutes', 10);
    const maxAttempts = this.config.get<number>('auth.otp.maxAttempts', 3);

    await this.otpModel.updateMany(
      { email: email.toLowerCase(), purpose, used: false },
      { $set: { used: true, usedAt: new Date() } },
    );

    const code = randomInt(100_000, 1_000_000).toString();
    await this.otpModel.create({
      email: email.toLowerCase(),
      codeHash: sha256(code),
      purpose,
      expiresAt: new Date(Date.now() + minutes * 60_000),
      maxAttempts,
    });
    return code;
  }

  async verify(
    email: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<OtpDocument> {
    const otp = await this.otpModel.findOne({
      email: email.toLowerCase(),
      purpose,
      used: false,
      expiresAt: { $gt: new Date() },
    });
    if (!otp) throw new BadRequestException('OTP expired or not found');

    if (otp.attempts >= otp.maxAttempts) {
      throw new UnauthorizedException(
        'Too many attempts. Please request a new code.',
      );
    }

    if (otp.codeHash !== sha256(code)) {
      otp.attempts += 1;
      await otp.save();
      const remaining = otp.maxAttempts - otp.attempts;
      throw new UnauthorizedException(
        remaining > 0
          ? `Wrong code. ${remaining} attempt(s) left.`
          : 'Too many attempts. Please request a new code.',
      );
    }

    otp.used = true;
    otp.usedAt = new Date();
    await otp.save();
    return otp;
  }
}
