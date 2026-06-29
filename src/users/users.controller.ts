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
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './service/users.service';
import { UserRankingService } from './service/ranking.service';

@ApiTags('Users')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly rankings: UserRankingService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Profile của user hiện tại' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.users.findById(user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật username/avatar' })
  async updateMe(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.updateProfile(userId, dto);
  }

  @Patch('me/preferences')
  @ApiOperation({ summary: 'Cập nhật discipline level / daily hours' })
  async updatePreferences(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.users.updatePreferences(userId, dto);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'XP, level, streak, badges, coins' })
  async myStats(@CurrentUser('userId') userId: Types.ObjectId) {
    const user = await this.users.findById(userId);
    const rankings = await this.rankings.getForUser(userId);
    return {
      gamification: user.gamification,
      rankings,
    };
  }

  // 'users/leaderboard' phải đứng trước 'users/:id', nếu không ':id' sẽ bắt mất route này
  @Get('users/leaderboard')
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

  @Get('users/:id')
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
