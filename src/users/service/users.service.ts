import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { LoginProvider, UserRole } from '../../common/enums';
import { User, UserDocument } from '../schemas/users.schema';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto';
import { DisciplineLevel } from '../../common/enums';

export interface CreateUserInput {
  username: string;
  email: string;
  password?: string;
  provider?: LoginProvider;
  providerId?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(input: CreateUserInput): Promise<UserDocument> {
    const exists = await this.userModel.exists({
      $or: [{ email: input.email.toLowerCase() }, { username: input.username }],
    });
    if (exists) throw new ConflictException('Email or username already in use');

    return this.userModel.create({
      ...input,
      email: input.email.toLowerCase(),
      provider: input.provider ?? LoginProvider.EMAIL,
      role: input.role ?? UserRole.USER,
    });
  }

  async findById(id: Types.ObjectId | string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password')
      .exec();
  }

  findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  findByProvider(
    provider: LoginProvider,
    providerId: string,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne({ provider, providerId }).exec();
  }

  async updateProfile(
    userId: Types.ObjectId,
    dto: UpdateUserDto,
  ): Promise<UserDocument> {
    if (dto.username) {
      const taken = await this.userModel.exists({
        username: dto.username,
        _id: { $ne: userId },
      });
      if (taken) throw new ConflictException('Username already taken');
    }
    const updated = await this.userModel.findByIdAndUpdate(userId, dto, {
      new: true,
    });
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async updatePreferences(
    userId: Types.ObjectId,
    dto: UpdatePreferencesDto,
  ): Promise<UserDocument> {
    const update: Record<string, unknown> = {};
    if (dto.dailyStudyHours !== undefined) {
      update['preferences.dailyStudyHours'] = dto.dailyStudyHours;
    }
    if (dto.focusTimeWindow !== undefined) {
      update['preferences.focusTimeWindow'] = dto.focusTimeWindow;
    }
    if (dto.disciplineLevel !== undefined) {
      update['preferences.disciplineLevel'] = dto.disciplineLevel;

      update['preferences.maxSubmitAttempts'] =
        dto.disciplineLevel === DisciplineLevel.STRICT ? 5 : 10;

      update['preferences.lockTimeMinutes'] =
        dto.disciplineLevel === DisciplineLevel.STRICT ? 30 : 15;
    }
    if (dto.milestoneTestPreference !== undefined) {
      update['preferences.milestoneTestPreference'] =
        dto.milestoneTestPreference;
    }
    const updated = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true },
    );
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async setPassword(
    userId: Types.ObjectId,
    hashedPassword: string,
  ): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { password: hashedPassword } },
    );
  }

  async markEmailVerified(userId: Types.ObjectId): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { emailVerified: true } },
    );
  }

  async setLastLogin(userId: Types.ObjectId): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { lastLoginAt: new Date(), failedLoginCount: 0 } },
    );
  }

  async lockAccount(userId: Types.ObjectId, untilDate: Date): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { isLocked: true, lockedUntil: untilDate } },
    );
  }

  async unlockAccount(userId: Types.ObjectId): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: { isLocked: false, failedLoginCount: 0 },
        $unset: { lockedUntil: '' },
      },
    );
  }

  async incrementFailedLogin(userId: Types.ObjectId): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $inc: { failedLoginCount: 1 } },
    );
  }

  async setCurrentRoadmap(
    userId: Types.ObjectId,
    roadmapId: Types.ObjectId,
  ): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { currentRoadmapId: roadmapId } },
    );
  }

  async completeFirstLogin(userId: Types.ObjectId): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { isFirstLogin: false } },
    );
  }

  async search(query: QueryFilter<UserDocument>, skip: number, limit: number) {
    const [items, total] = await Promise.all([
      this.userModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.userModel.countDocuments(query),
    ]);
    return { items, total };
  }
}
