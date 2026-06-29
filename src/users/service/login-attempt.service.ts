import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LoginAttemptResult } from '../../common/enums';
import {
  LoginAttempt,
  LoginAttemptDocument,
} from '../schemas/login-attempt.schema';

interface RecordParams {
  email: string;
  userId?: Types.ObjectId;
  result: LoginAttemptResult;
  ipAddress?: string;
  userAgent?: string;
  captchaRequired?: boolean;
  captchaPassed?: boolean;
}

@Injectable()
export class LoginAttemptService {
  constructor(
    @InjectModel(LoginAttempt.name)
    private readonly attemptModel: Model<LoginAttemptDocument>,
    private readonly config: ConfigService,
  ) {}

  async record(params: RecordParams): Promise<LoginAttemptDocument> {
    return this.attemptModel.create({
      email: params.email.toLowerCase(),
      userId: params.userId,
      result: params.result,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      captchaRequired: params.captchaRequired ?? false,
      captchaPassed: params.captchaPassed ?? false,
    });
  }

  async countRecentFailures(email: string): Promise<number> {
    const windowMin = this.config.get<number>(
      'auth.login.countWindowMinutes',
      15,
    );
    const since = new Date(Date.now() - windowMin * 60_000);
    return this.attemptModel.countDocuments({
      email: email.toLowerCase(),
      result: { $ne: LoginAttemptResult.SUCCESS },
      createdAt: { $gte: since },
    });
  }

  async shouldRequireCaptcha(email: string): Promise<boolean> {
    const threshold = this.config.get<number>('auth.login.captchaThreshold', 3);
    return (await this.countRecentFailures(email)) >= threshold;
  }

  async shouldLockAccount(email: string): Promise<boolean> {
    const max = this.config.get<number>('auth.login.maxAttempts', 5);
    return (await this.countRecentFailures(email)) >= max;
  }

  async clearFor(email: string): Promise<void> {
    await this.attemptModel.deleteMany({
      email: email.toLowerCase(),
      result: { $ne: LoginAttemptResult.SUCCESS },
    });
  }
}
