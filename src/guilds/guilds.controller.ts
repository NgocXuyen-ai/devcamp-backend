import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import {
  CreateGuildDto,
  CreateGuildQuestDto,
  GetGuildsQueryDto,
  UpdateGuildDto,
} from './dto/guilds.dto';
import { GuildsService } from './guilds.service';
import { Types } from 'mongoose';

@ApiTags('Guilds')
@Controller('guilds')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GuildsController {
  constructor(private readonly guilds: GuildsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Lấy tổng quan guild dashboard' })
  getOverview(@CurrentUser('userId') userId: Types.ObjectId) {
    return this.guilds.getOverview(userId);
  }

  @Get('my-guild')
  @ApiOperation({ summary: 'Lấy guild hiện tại của user' })
  getMyGuild(@CurrentUser('userId') userId: Types.ObjectId) {
    return this.guilds.getMyGuild(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách guild có filter / search / sort' })
  getGuilds(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Query() query: GetGuildsQueryDto,
  ) {
    return this.guilds.listGuilds(userId, query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Chi tiết một guild' })
  getGuildDetail(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Param('slug') slug: string,
  ) {
    return this.guilds.getGuildDetail(userId, slug);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo guild mới' })
  createGuild(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Body() dto: CreateGuildDto,
  ) {
    return this.guilds.createGuild(userId, dto);
  }

  @Patch(':slug')
  @ApiOperation({ summary: 'Cập nhật thông tin guild (owner)' })
  updateGuild(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Param('slug') slug: string,
    @Body() dto: UpdateGuildDto,
  ) {
    return this.guilds.updateGuild(userId, slug, dto);
  }

  @Post(':slug/join')
  @ApiOperation({ summary: 'Tham gia guild' })
  joinGuild(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Param('slug') slug: string,
  ) {
    return this.guilds.joinGuild(userId, slug);
  }

  @Post(':slug/leave')
  @ApiOperation({ summary: 'Rời guild' })
  leaveGuild(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Param('slug') slug: string,
  ) {
    return this.guilds.leaveGuild(userId, slug);
  }

  @Delete(':slug/members/:memberId')
  @ApiOperation({ summary: 'Owner loại thành viên khỏi guild' })
  removeMember(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Param('slug') slug: string,
    @Param('memberId') memberId: string,
  ) {
    return this.guilds.removeMember(userId, slug, memberId);
  }

  @Post(':slug/quests')
  @ApiOperation({ summary: 'Owner tạo quest mới cho guild' })
  createQuest(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Param('slug') slug: string,
    @Body() dto: CreateGuildQuestDto,
  ) {
    return this.guilds.createQuest(userId, slug, dto);
  }

  @Post(':slug/quests/:questId/claim')
  @ApiOperation({ summary: 'Claim phần thưởng quest' })
  claimQuest(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Param('slug') slug: string,
    @Param('questId') questId: string,
  ) {
    return this.guilds.claimQuest(userId, slug, questId);
  }

  @Delete(':slug/quests/:questId')
  @ApiOperation({ summary: 'Owner xoá quest khỏi guild' })
  deleteQuest(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Param('slug') slug: string,
    @Param('questId') questId: string,
  ) {
    return this.guilds.deleteQuest(userId, slug, questId);
  }
}
