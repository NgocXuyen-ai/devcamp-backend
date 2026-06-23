import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { AiMentorConfigDto } from '../dto/admin-config.dto';
import {
  AnalyticsRangeDto,
  TopUsersQueryDto,
} from '../dto/analytics-query.dto';
import { AdminAiMentorService } from '../service/admin-ai-mentor.service';
import { AdminAnalyticsService } from '../service/admin-analytics.service';

@ApiTags('Admin · AI Mentor')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/ai-mentor')
export class AdminAiMentorController {
  constructor(private readonly service: AdminAiMentorService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get current AI Mentor default config' })
  get() {
    return this.service.get();
  }

  @Patch('config')
  @ApiOperation({
    summary:
      'Update AI Mentor defaults (style, tone, model, token + hint limits)',
  })
  update(
    @Body() dto: AiMentorConfigDto,
    @CurrentUser('userId') actorId: Types.ObjectId,
  ) {
    return this.service.update(dto, actorId);
  }

  @Post('config/reset')
  @ApiOperation({ summary: 'Reset AI Mentor config to baseline defaults' })
  reset(@CurrentUser('userId') actorId: Types.ObjectId) {
    return this.service.reset(actorId);
  }
}

@ApiTags('Admin · Analytics')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly service: AdminAnalyticsService) {}

  @Get('users')
  @ApiOperation({ summary: 'Users overview — total, DAU, WAU, MAU, new users' })
  usersOverview(@Query() q: AnalyticsRangeDto) {
    return this.service.usersOverview(q);
  }

  @Get('users/signup-trend')
  @ApiOperation({ summary: 'Signup time-series for charts' })
  signupTrend(@Query() q: AnalyticsRangeDto) {
    return this.service.signupTrend(q);
  }

  @Get('errors')
  @ApiOperation({ summary: 'Community-wide error overview' })
  errorsOverview(@Query() q: AnalyticsRangeDto) {
    return this.service.errorsOverview(q);
  }

  @Get('errors/trend')
  @ApiOperation({ summary: 'Error time-series for the Trend Analysis chart' })
  errorTrend(@Query() q: AnalyticsRangeDto) {
    return this.service.errorTrend(q);
  }

  @Get('errors/active-anomalies')
  @ApiOperation({ summary: 'Heuristic anomaly detection — submission spikes' })
  activeAnomalies() {
    return this.service.activeAnomalies();
  }

  @Get('users/top-affected')
  @ApiOperation({ summary: 'Top users by submission failures in range' })
  topAffected(@Query() q: TopUsersQueryDto) {
    return this.service.topAffectedUsers(q);
  }
}
