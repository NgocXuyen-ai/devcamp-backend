import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateGuildDto,
  CreateGuildQuestDto,
  GetGuildsQueryDto,
  UpdateGuildDto,
} from './dto/guilds.dto';
import { buildGuildSeedData, TYPE_COLORS } from './guild.seed';
import {
  Guild,
  GuildDocument,
  GuildMemberHighlight,
  GuildQuest,
} from './schemas/guild.schema';
import { User, UserDocument } from '../users/schemas/users.schema';
import { UsersService } from '../users/service/users.service';
import { GamificationService } from '../users/service/gamification.service';

type GuildSortKey = NonNullable<GetGuildsQueryDto['sortBy']>;

@Injectable()
export class GuildsService {
  constructor(
    @InjectModel(Guild.name)
    private readonly guildModel: Model<GuildDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly usersService: UsersService,
    private readonly gamificationService: GamificationService,
  ) { }

  async getOverview(userId: Types.ObjectId) {
    await this.ensureSeeded();

    const [guilds, myGuild] = await Promise.all([
      this.guildModel.find().sort({ rank: 1 }).lean(),
      this.findGuildForUser(userId),
    ]);

    const featuredGuild =
      guilds.find((guild) => guild.featured) ??
      [...guilds].sort((a, b) => a.rank - b.rank)[0];

    const totalMembers = guilds.reduce(
      (sum, guild) => sum + guild.memberCount,
      0,
    );
    const avgWinRate = guilds.length
      ? Math.round(
        guilds.reduce((sum, guild) => sum + guild.winRate, 0) / guilds.length,
      )
      : 0;
    const totalQuests = guilds.reduce(
      (sum, guild) => sum + guild.quests.length,
      0,
    );

    return {
      stats: {
        totalGuilds: guilds.length,
        totalMembers,
        avgWinRate,
        totalQuests,
      },
      featuredGuild: featuredGuild
        ? this.shapeGuildCard(featuredGuild, userId, Boolean(myGuild))
        : null,
      myGuild: myGuild ? this.shapeGuildMini(myGuild, userId) : null,
    };
  }

  async listGuilds(userId: Types.ObjectId, query: GetGuildsQueryDto) {
    await this.ensureSeeded();

    const normalizedSearch = query.search?.trim().toLowerCase() ?? '';
    const sortBy: GuildSortKey = query.sortBy ?? 'rank';
    const myGuild = await this.findGuildForUser(userId);
    const hasOtherGuild = Boolean(myGuild);

    const guilds = await this.guildModel.find().sort({ rank: 1 }).lean();

    const filtered = guilds
      .filter((guild) => {
        if (query.type && guild.type !== query.type) return false;
        if (!normalizedSearch) return true;
        return (
          guild.name.toLowerCase().includes(normalizedSearch) ||
          guild.type.toLowerCase().includes(normalizedSearch) ||
          guild.description.toLowerCase().includes(normalizedSearch) ||
          guild.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch))
        );
      })
      .sort((left, right) => this.sortGuilds(left, right, sortBy));

    return {
      items: filtered.map((guild) =>
        this.shapeGuildCard(
          guild,
          userId,
          hasOtherGuild && String(myGuild?._id) !== String(guild._id),
        ),
      ),
    };
  }

  async getMyGuild(userId: Types.ObjectId) {
    await this.ensureSeeded();
    const guild = await this.findGuildForUser(userId);
    if (!guild) return null;
    return this.shapeGuildDetail(guild, userId);
  }

  async getGuildDetail(userId: Types.ObjectId, slug: string) {
    await this.ensureSeeded();
    const guild = await this.getGuildBySlugOrThrow(slug);
    return this.shapeGuildDetail(guild.toObject(), userId);
  }

  async createGuild(userId: Types.ObjectId, dto: CreateGuildDto) {
    await this.ensureSeeded();

    const existingMembership = await this.findGuildForUser(userId);
    if (existingMembership) {
      throw new ConflictException('Bạn đang ở trong một guild khác.');
    }

    const user = await this.usersService.findById(userId);
    const baseSlug = this.slugify(dto.name);
    const slug = await this.ensureUniqueSlug(baseSlug);

    const now = new Date();
    const guild = await this.guildModel.create({
      slug,
      name: dto.name.trim(),
      type: dto.type,
      description: dto.description.trim(),
      mission: dto.recruitmentPitch?.trim() || dto.description.trim(),
      language:
        dto.language?.trim() ||
        user.knownLanguages?.join(' / ') ||
        'Mixed stack',
      headquarters: dto.headquarters?.trim() || 'Remote-first',
      recruitmentPitch:
        dto.recruitmentPitch?.trim() ||
        'Guild mới đang tuyển những thành viên đầu tiên để build văn hóa và leo rank cùng nhau.',
      color: TYPE_COLORS[dto.type],
      rank: (await this.guildModel.countDocuments()) + 1,
      level: Math.max(1, user.gamification?.level ?? 1),
      xp: Math.max(0, user.gamification?.xp ?? 0),
      xpNext: Math.max(5000, (user.gamification?.level ?? 1) * 5000),
      weeklyXP: 0,
      winRate: 0,
      memberCount: 1,
      maxMembers: dto.maxMembers ?? 120,
      founded: String(now.getFullYear()),
      openToJoin: dto.openToJoin ?? true,
      featured: false,
      tags: (dto.tags ?? []).slice(0, 6),
      requirements: [
        { label: 'Founder', value: user.username },
        { label: 'Focus', value: dto.type },
        { label: 'First milestone', value: 'Recruit 5 members đầu tiên' },
      ],
      perks: [
        'Founder dashboard và guild wall riêng',
        'Tạo quest nội bộ và theo dõi hoạt động team',
        'Có thể mở rộng guild thành squad mạnh theo chuyên môn',
      ],
      quests: [
        {
          questId: 'launch-week',
          title: 'Launch week',
          description:
            'Chiêu mộ thành viên đầu tiên và hoàn thiện bản sắc của guild.',
          category: 'Launch',
          difficulty: 'Medium',
          progress: 1,
          total: 5,
          rewardXp: 1500,
          rewardCoins: 120,
          dueInDays: 7,
        },
        {
          questId: 'first-battles',
          title: 'First battle streak',
          description: 'Thắng 3 battle đầu tiên với tư cách thành viên guild.',
          category: 'Ranked',
          difficulty: 'Medium',
          progress: 0,
          total: 3,
          rewardXp: 2200,
          rewardCoins: 160,
          dueInDays: 5,
        },
      ],
      questClaims: [],
      activityFeed: [
        {
          type: 'guild_created',
          title: 'Guild vừa được tạo',
          description: `${user.username} đã khai sinh guild này và mở cổng tuyển thành viên đầu tiên.`,
          createdAt: now,
        },
      ],
      featuredMembers: [
        this.createHighlightFromUser(user, 'Founder', 'Guild Lead'),
      ],
      memberIds: [user._id],
      ownerId: user._id,
    });

    return this.shapeGuildDetail(guild.toObject(), userId);
  }

  async updateGuild(userId: Types.ObjectId, slug: string, dto: UpdateGuildDto) {
    await this.ensureSeeded();
    const guild = await this.getGuildBySlugOrThrow(slug);
    this.assertOwner(guild, userId);

    if (dto.maxMembers !== undefined && dto.maxMembers < guild.memberCount) {
      throw new ConflictException(
        `Sức chứa mới không được nhỏ hơn số thành viên hiện tại (${guild.memberCount}).`,
      );
    }

    if (dto.name?.trim() && dto.name.trim() !== guild.name) {
      const nextSlug = await this.ensureUniqueSlug(this.slugify(dto.name));
      guild.slug = nextSlug;
      guild.name = dto.name.trim();
    }

    if (dto.type) {
      guild.type = dto.type;
      guild.color = TYPE_COLORS[dto.type];
    }

    if (dto.description?.trim()) {
      guild.description = dto.description.trim();
    }

    if (dto.mission !== undefined) {
      guild.mission = dto.mission.trim();
    }

    if (dto.recruitmentPitch !== undefined) {
      guild.recruitmentPitch = dto.recruitmentPitch.trim();
    }

    if (dto.language !== undefined) {
      guild.language = dto.language.trim();
    }

    if (dto.headquarters !== undefined) {
      guild.headquarters = dto.headquarters.trim();
    }

    if (dto.openToJoin !== undefined) {
      guild.openToJoin = dto.openToJoin;
    }

    if (dto.maxMembers !== undefined) {
      guild.maxMembers = dto.maxMembers;
    }

    if (dto.tags) {
      guild.tags = [
        ...new Set(dto.tags.map((tag) => tag.trim()).filter(Boolean)),
      ].slice(0, 6);
    }

    guild.activityFeed.unshift({
      type: 'guild_updated',
      title: 'Guild đã được cập nhật',
      description:
        'Owner vừa thay đổi thông tin, cấu hình hoặc trạng thái tuyển thành viên.',
      createdAt: new Date(),
    });

    await guild.save();
    return this.shapeGuildDetail(guild.toObject(), userId);
  }

  async joinGuild(userId: Types.ObjectId, slug: string) {
    await this.ensureSeeded();
    const guild = await this.getGuildBySlugOrThrow(slug);

    const currentGuild = await this.findGuildForUser(userId);
    if (currentGuild && String(currentGuild._id) !== String(guild._id)) {
      throw new ConflictException('Bạn đã tham gia một guild khác rồi.');
    }

    if (this.isMember(guild, userId)) {
      throw new ConflictException('Bạn đã là thành viên của guild này.');
    }

    if (!guild.openToJoin) {
      throw new ConflictException('Guild này hiện đang đóng tuyển thành viên.');
    }

    if (guild.memberCount >= guild.maxMembers) {
      throw new ConflictException('Guild đã đầy.');
    }

    const user = await this.usersService.findById(userId);
    guild.memberIds.push(user._id);
    guild.memberCount += 1;
    guild.featuredMembers = this.upsertFeaturedMember(
      guild.featuredMembers,
      this.createHighlightFromUser(user, 'New Member', 'Builder'),
    );
    guild.activityFeed.unshift({
      type: 'member_joined',
      title: `${user.username} vừa tham gia`,
      description: `${user.username} đã gia nhập ${guild.name} để bắt đầu leo rank cùng team.`,
      createdAt: new Date(),
    });

    await guild.save();
    return this.shapeGuildDetail(guild.toObject(), userId);
  }

  async leaveGuild(userId: Types.ObjectId, slug: string) {
    await this.ensureSeeded();
    const guild = await this.getGuildBySlugOrThrow(slug);

    if (!this.isMember(guild, userId)) {
      throw new BadRequestException('Bạn chưa ở trong guild này.');
    }

    if (guild.ownerId && String(guild.ownerId) === String(userId)) {
      throw new ConflictException(
        'Guild owner hiện chưa thể rời guild của chính mình.',
      );
    }

    const user = await this.usersService.findById(userId);
    guild.memberIds = guild.memberIds.filter(
      (id) => String(id) !== String(userId),
    );
    guild.memberCount = Math.max(0, guild.memberCount - 1);
    guild.featuredMembers = guild.featuredMembers.filter(
      (member) => String(member.userId) !== String(userId),
    );
    guild.activityFeed.unshift({
      type: 'member_left',
      title: `${user.username} đã rời guild`,
      description: `${user.username} đang quay lại trạng thái solo và có thể tìm guild mới bất cứ lúc nào.`,
      createdAt: new Date(),
    });

    await guild.save();
    return { success: true };
  }

  async removeMember(userId: Types.ObjectId, slug: string, memberId: string) {
    await this.ensureSeeded();
    const guild = await this.getGuildBySlugOrThrow(slug);
    this.assertOwner(guild, userId);

    if (!Types.ObjectId.isValid(memberId)) {
      throw new BadRequestException('memberId không hợp lệ.');
    }

    if (guild.ownerId && String(guild.ownerId) === memberId) {
      throw new ConflictException('Không thể loại owner khỏi guild.');
    }

    const targetUser = await this.usersService.findById(memberId);

    if (!guild.memberIds.some((id) => String(id) === memberId)) {
      throw new NotFoundException('Thành viên không thuộc guild này.');
    }

    guild.memberIds = guild.memberIds.filter((id) => String(id) !== memberId);
    guild.memberCount = Math.max(0, guild.memberCount - 1);
    guild.featuredMembers = guild.featuredMembers.filter(
      (member) => String(member.userId) !== memberId,
    );
    guild.activityFeed.unshift({
      type: 'member_removed',
      title: `${targetUser.username} đã bị loại khỏi guild`,
      description:
        'Owner vừa cập nhật đội hình và loại một thành viên khỏi guild.',
      createdAt: new Date(),
    });

    await guild.save();
    return this.shapeGuildDetail(guild.toObject(), userId);
  }

  async createQuest(
    userId: Types.ObjectId,
    slug: string,
    dto: CreateGuildQuestDto,
  ) {
    await this.ensureSeeded();
    const guild = await this.getGuildBySlugOrThrow(slug);
    this.assertOwner(guild, userId);

    const questId = this.createQuestId(dto.title);
    if (guild.quests.some((quest) => quest.questId === questId)) {
      throw new ConflictException('Quest với tiêu đề này đã tồn tại.');
    }

    guild.quests.unshift({
      questId,
      title: dto.title.trim(),
      description: dto.description.trim(),
      category: dto.category.trim(),
      difficulty: dto.difficulty.trim(),
      progress: 0,
      total: dto.total,
      rewardXp: dto.rewardXp,
      rewardCoins: dto.rewardCoins,
      dueInDays: dto.dueInDays ?? 7,
    });

    guild.activityFeed.unshift({
      type: 'quest_created',
      title: `Quest mới: ${dto.title.trim()}`,
      description: 'Owner vừa thêm một quest mới vào quest board của guild.',
      createdAt: new Date(),
    });

    await guild.save();
    return this.shapeGuildDetail(guild.toObject(), userId);
  }

  async claimQuest(userId: Types.ObjectId, slug: string, questId: string) {
    await this.ensureSeeded();
    const guild = await this.getGuildBySlugOrThrow(slug);

    if (!this.isMember(guild, userId)) {
      throw new ConflictException(
        'Bạn cần tham gia guild trước khi claim quest.',
      );
    }

    const quest = guild.quests.find((item) => item.questId === questId);
    if (!quest) {
      throw new NotFoundException('Quest không tồn tại.');
    }

    if (quest.progress < quest.total) {
      throw new ConflictException(
        'Quest này chưa hoàn thành nên chưa claim được.',
      );
    }

    const alreadyClaimed = guild.questClaims.some(
      (claim) =>
        claim.questId === questId && String(claim.userId) === String(userId),
    );
    if (alreadyClaimed) {
      throw new ConflictException('Bạn đã claim quest này rồi.');
    }

    guild.questClaims.push({
      questId,
      userId,
      claimedAt: new Date(),
    });

    guild.activityFeed.unshift({
      type: 'quest_claimed',
      title: `Quest "${quest.title}" đã được claim`,
      description: `Một thành viên vừa nhận ${quest.rewardXp.toLocaleString()} XP và ${quest.rewardCoins} coins.`,
      createdAt: new Date(),
    });

    // Dùng addXp()/addCoins() thay vì $inc trực tiếp: $inc chỉ cộng số xp thô
    // mà không tính lại gamification.level, nên level bị "đứng yên" dù xp đã
    // tăng. addXp() luôn gọi computeLevelFromXp() sau khi cộng, giữ level
    // đồng bộ tuyệt đối với xp — cùng cơ chế Practice/Battle đang dùng.
    await Promise.all([
      guild.save(),
      this.gamificationService.addXp(userId, quest.rewardXp),
      this.gamificationService.addCoins(userId, quest.rewardCoins),
    ]);

    return {
      rewardXp: quest.rewardXp,
      rewardCoins: quest.rewardCoins,
      questId,
    };
  }

  async deleteQuest(userId: Types.ObjectId, slug: string, questId: string) {
    await this.ensureSeeded();
    const guild = await this.getGuildBySlugOrThrow(slug);
    this.assertOwner(guild, userId);

    const quest = guild.quests.find((item) => item.questId === questId);
    if (!quest) {
      throw new NotFoundException('Quest không tồn tại.');
    }

    guild.quests = guild.quests.filter((item) => item.questId !== questId);
    guild.questClaims = guild.questClaims.filter(
      (claim) => claim.questId !== questId,
    );
    guild.activityFeed.unshift({
      type: 'quest_deleted',
      title: `Đã xoá quest: ${quest.title}`,
      description: 'Quest này đã được gỡ khỏi quest board của guild.',
      createdAt: new Date(),
    });

    await guild.save();
    return this.shapeGuildDetail(guild.toObject(), userId);
  }

  private async ensureSeeded() {
    const count = await this.guildModel.countDocuments();
    if (count > 0) return;
    await this.guildModel.insertMany(buildGuildSeedData());
  }

  private async findGuildForUser(userId: Types.ObjectId) {
    return this.guildModel.findOne({
      $or: [{ memberIds: userId }, { ownerId: userId }],
    });
  }

  private async getGuildBySlugOrThrow(slug: string) {
    const guild = await this.guildModel.findOne({ slug });
    if (!guild) throw new NotFoundException('Guild không tồn tại.');
    return guild;
  }

  private assertOwner(guild: Pick<Guild, 'ownerId'>, userId: Types.ObjectId) {
    if (!guild.ownerId || String(guild.ownerId) !== String(userId)) {
      throw new ConflictException('Chỉ owner mới có quyền quản lý guild này.');
    }
  }

  private isMember(
    guild: Pick<Guild, 'memberIds' | 'ownerId'>,
    userId: Types.ObjectId,
  ) {
    return (
      String(guild.ownerId) === String(userId) ||
      guild.memberIds.some((memberId) => String(memberId) === String(userId))
    );
  }

  private shapeGuildMini(guild: Guild | GuildDocument, userId: Types.ObjectId) {
    const guildId = String((guild as GuildDocument)._id);
    return {
      id: guildId,
      slug: guild.slug,
      name: guild.name,
      type: guild.type,
      color: guild.color,
      memberCount: guild.memberCount,
      rank: guild.rank,
      level: guild.level,
      isOwner: guild.ownerId ? String(guild.ownerId) === String(userId) : false,
    };
  }

  private shapeGuildCard(
    guild: Guild | (Guild & { _id: Types.ObjectId }),
    userId: Types.ObjectId,
    hasAnotherGuild: boolean,
  ) {
    const guildId = String((guild as GuildDocument)._id);
    const isMember = this.isMember(guild, userId);
    const canJoin =
      guild.openToJoin &&
      guild.memberCount < guild.maxMembers &&
      !isMember &&
      !hasAnotherGuild;

    return {
      id: guildId,
      slug: guild.slug,
      name: guild.name,
      type: guild.type,
      color: guild.color,
      rank: guild.rank,
      level: guild.level,
      xp: guild.xp,
      xpNext: guild.xpNext,
      weeklyXP: guild.weeklyXP,
      winRate: guild.winRate,
      members: guild.memberCount,
      maxMembers: guild.maxMembers,
      founded: guild.founded,
      openToJoin: guild.openToJoin,
      featured: guild.featured,
      description: guild.description,
      mission: guild.mission,
      tags: guild.tags,
      language: guild.language,
      quests: guild.quests.map((quest) => ({
        questId: quest.questId,
        label: quest.title,
        progress: quest.progress,
        total: quest.total,
        reward: `${quest.rewardXp.toLocaleString()} XP`,
        category: quest.category,
        difficulty: quest.difficulty,
      })),
      memberAvatars: guild.featuredMembers
        .slice(0, 5)
        .map(
          (member) =>
            member.initials || member.username.slice(0, 1).toUpperCase(),
        ),
      memberHighlights: guild.featuredMembers.slice(0, 4).map((member) => ({
        username: member.username,
        title: member.title,
        roleLabel: member.roleLabel,
        avatarUrl: member.avatarUrl,
        initials: member.initials || member.username.slice(0, 1).toUpperCase(),
      })),
      isMember,
      canJoin,
      isOwner: guild.ownerId ? String(guild.ownerId) === String(userId) : false,
      headquarters: guild.headquarters,
      recruitmentPitch: guild.recruitmentPitch,
      availableSeats: Math.max(0, guild.maxMembers - guild.memberCount),
    };
  }

  private async shapeGuildDetail(
    guild: Guild | (Guild & { _id: Types.ObjectId }),
    userId: Types.ObjectId,
  ) {
    const card = this.shapeGuildCard(guild, userId, false);
    const claimedQuestIds = new Set(
      guild.questClaims
        .filter((claim) => String(claim.userId) === String(userId))
        .map((claim) => claim.questId),
    );
    const members = await this.resolveGuildMembers(guild, userId);

    return {
      ...card,
      mission: guild.mission,
      headquarters: guild.headquarters,
      recruitmentPitch: guild.recruitmentPitch,
      requirements: guild.requirements,
      perks: guild.perks,
      activityFeed: guild.activityFeed.slice(0, 20).map((activity) => ({
        type: activity.type,
        title: activity.title,
        description: activity.description,
        createdAt: activity.createdAt,
      })),
      quests: guild.quests.map((quest: GuildQuest) => ({
        questId: quest.questId,
        title: quest.title,
        description: quest.description,
        category: quest.category,
        difficulty: quest.difficulty,
        progress: quest.progress,
        total: quest.total,
        rewardXp: quest.rewardXp,
        rewardCoins: quest.rewardCoins,
        dueInDays: quest.dueInDays,
        completed: quest.progress >= quest.total,
        claimed: claimedQuestIds.has(quest.questId),
      })),
      members,
    };
  }

  private async resolveGuildMembers(
    guild: Guild | (Guild & { _id: Types.ObjectId }),
    userId: Types.ObjectId,
  ) {
    const orderedIds = Array.from(
      new Set(
        [guild.ownerId, ...guild.memberIds]
          .filter((id): id is Types.ObjectId => Boolean(id))
          .map((id) => String(id)),
      ),
    );

    if (orderedIds.length === 0) return [];

    const users = await this.userModel
      .find({
        _id: {
          $in: orderedIds.map((id) => new Types.ObjectId(id)),
        },
      })
      .lean();

    const userMap = new Map(
      users.map((member) => [String(member._id), member]),
    );
    const highlightMap = new Map(
      guild.featuredMembers
        .filter((member) => member.userId)
        .map((member) => [String(member.userId), member] as const),
    );

    return orderedIds
      .map((id) => {
        const member = userMap.get(id);
        if (!member) return null;
        const highlight = highlightMap.get(id);
        const isOwner = guild.ownerId ? String(guild.ownerId) === id : false;
        return {
          id,
          username: member.username,
          title: highlight?.title || (isOwner ? 'Founder' : 'Member'),
          roleLabel:
            highlight?.roleLabel || (isOwner ? 'Guild Lead' : 'Member'),
          avatarUrl:
            member.avatarUrl ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.username)}`,
          initials: member.username.slice(0, 1).toUpperCase(),
          contributionXp:
            member.gamification?.xp ?? highlight?.contributionXp ?? 0,
          joinedAt: highlight?.joinedAt ?? new Date(),
          isCurrentUser: id === String(userId),
        };
      })
      .filter(Boolean);
  }

  private createHighlightFromUser(
    user: UserDocument,
    title: string,
    roleLabel: string,
  ): GuildMemberHighlight {
    return {
      userId: user._id,
      username: user.username,
      title,
      roleLabel,
      avatarUrl:
        user.avatarUrl ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username)}`,
      initials: user.username.slice(0, 1).toUpperCase(),
      contributionXp: user.gamification?.xp ?? 0,
      joinedAt: new Date(),
    };
  }

  private upsertFeaturedMember(
    members: GuildMemberHighlight[],
    nextMember: GuildMemberHighlight,
  ) {
    const existing = members.find(
      (member) => String(member.userId) === String(nextMember.userId),
    );
    if (existing) return members;
    return [nextMember, ...members].slice(0, 8);
  }

  private sortGuilds(
    left: Guild & { _id: Types.ObjectId },
    right: Guild & { _id: Types.ObjectId },
    sortBy: GuildSortKey,
  ) {
    if (sortBy === 'members') return right.memberCount - left.memberCount;
    if (sortBy === 'winRate') return right.winRate - left.winRate;
    if (sortBy === 'weeklyXP') return right.weeklyXP - left.weeklyXP;
    return left.rank - right.rank;
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private createQuestId(value: string) {
    return this.slugify(value).slice(0, 40) || `quest-${Date.now()}`;
  }

  private async ensureUniqueSlug(baseSlug: string) {
    let slug = baseSlug || 'guild';
    let counter = 2;
    while (await this.guildModel.exists({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }
    return slug;
  }
}
