import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { paginate } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/object-id.pipe';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import { XpLeaderboardQueryDto } from './dto/xp-leaderboard-query.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './service/users.service';
import { UserRankingService } from './service/ranking.service';
import { ExercisesService } from '../exercises/exercises.service';
import { UserDocument } from './schemas/users.schema';
import { getXpProgress } from './service/gamification.service';

@ApiTags('Me')
@Controller('me')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MeController {
  constructor(
    private readonly users: UsersService,
    private readonly rankings: UserRankingService,
    private readonly exercises: ExercisesService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Profile của user hiện tại' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.users.findById(user.userId);
  }

  @Get('summary')
  @ApiOperation({
    summary:
      'Gộp profile + gamification + rankings + progress-summary cho trang Profile, tránh FE phải gọi nhiều API rời rạc',
  })
  async mySummary(@CurrentUser('userId') userId: Types.ObjectId) {
    const [user, rankings, progressSummary] = await Promise.all([
      this.users.findById(userId),
      this.rankings.getForUser(userId),
      this.exercises.getProgressSummary(userId),
    ]);
    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      location: user.location,
      socialLinks: user.socialLinks,
      showProfile: user.showProfile,
      showCertificates: user.showCertificates,
      fieldFocus: user.fieldFocus,
      selfAssessedLevel: user.selfAssessedLevel,
      createdAt: (user as UserDocument & { createdAt: Date }).createdAt,
      gamification: user.gamification,
      followerCount: user.followers.length,
      followingCount: user.following.length,
      friendCount: user.friends.length,
      rankings,
      progressSummary,
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật username/avatar' })
  async updateMe(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.updateProfile(userId, dto);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Cập nhật discipline level / daily hours' })
  async updatePreferences(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.users.updatePreferences(userId, dto);
  }

  @Get('stats')
  @ApiOperation({
    summary:
      'XP, level, streak, badges, coins + xpProgress (tiến độ XP trong level hiện tại, dùng để vẽ progress bar)',
  })
  async myStats(@CurrentUser('userId') userId: Types.ObjectId) {
    const user = await this.users.findById(userId);
    const rankings = await this.rankings.getForUser(userId);
    return {
      gamification: user.gamification,
      xpProgress: getXpProgress(user.gamification.xp),
      rankings,
    };
  }
}

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly rankings: UserRankingService,
  ) { }

  // 'leaderboard' phải đứng trước ':id', nếu không ':id' sẽ bắt mất route này
  @Get('leaderboard')
  @Public()
  @ApiOperation({ summary: 'Bảng xếp hạng theo field' })
  async leaderboard(@Query() q: LeaderboardQueryDto) {
    const { items, total } = await this.rankings.getLeaderboard(
      q.field,
      q.skip,
      q.limit ?? 20,
    );
    return paginate(items, total, q.page ?? 1, q.limit ?? 20);
  }

  // Cũng phải đứng trước ':id' vì cùng lý do route-matching ở trên.
  @Get('leaderboard/xp')
  @Public()
  @ApiOperation({
    summary:
      'Top user theo tổng XP toàn thời gian (all-time, toàn hệ thống) — dùng cho mini leaderboard trang chủ',
  })
  async xpLeaderboard(@Query() q: XpLeaderboardQueryDto) {
    return this.users.getXpLeaderboard(q.limit ?? 3);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Public profile (cho leaderboard / battle preview)',
  })
  async publicProfile(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    const user = await this.users.findById(id);
    const rankings = await this.rankings.getForUser(id);
    return {
      _id: user._id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      fieldFocus: user.fieldFocus,
      gamification: {
        level: user.gamification.level,
        xp: user.gamification.xp,
        currentStreak: user.gamification.currentStreak,
        badges: user.gamification.badges,
      },
      rankings,
    };
  }
}