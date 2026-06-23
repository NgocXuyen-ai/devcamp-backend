import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { User, UserDocument } from '../users/schemas/users.schema';
import { ShopItem, ShopItemDocument } from './schemas/shop-item.schema';
import {
  ShopInventoryItem,
  ShopInventoryDocument,
} from './schemas/shop-inventory.schema';
import { ShopPurchase, ShopPurchaseDocument } from './schemas/shop-purchase.schema';
import { ShopCoupon, ShopCouponDocument } from './schemas/shop-coupon.schema';
import {
  ShopCouponRedemption,
  ShopCouponRedemptionDocument,
} from './schemas/shop-coupon-redemption.schema';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type ListItemsQuery = {
  search?: string;
  category?: string;
  sort?: 'priceAsc' | 'priceDesc' | 'newest';
};

@Injectable()
export class ShopService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(ShopItem.name) private readonly itemModel: Model<ShopItemDocument>,
    @InjectModel(ShopInventoryItem.name)
    private readonly inventoryModel: Model<ShopInventoryDocument>,
    @InjectModel(ShopPurchase.name)
    private readonly purchaseModel: Model<ShopPurchaseDocument>,
    @InjectModel(ShopCoupon.name)
    private readonly couponModel: Model<ShopCouponDocument>,
    @InjectModel(ShopCouponRedemption.name)
    private readonly redemptionModel: Model<ShopCouponRedemptionDocument>
  ) {}

  async onModuleInit() {
    await this.ensureSeedData();
  }

  private async ensureSeedData() {
    const count = await this.itemModel.countDocuments({}).exec();
    if (count === 0) {
      await this.itemModel.insertMany([
        {
          sku: 'BOOST_XP_1H',
          name: 'XP Boost (1 giờ)',
          description: 'Nhân đôi XP nhận được trong 1 giờ (demo).',
          category: 'Boosters',
          type: 'booster',
          priceCoins: 120,
          imageUrl: '/component_2_2x.png',
          tags: ['xp', 'boost'],
          isActive: true,
        },
        {
          sku: 'SKIN_NEON',
          name: 'Neon Theme',
          description: 'Mở khoá theme neon cho UI (demo).',
          category: 'Cosmetics',
          type: 'cosmetic',
          priceCoins: 300,
          imageUrl: '/component_2_2x.png',
          tags: ['theme', 'neon'],
          isActive: true,
        },
        {
          sku: 'EXTRA_SUBMISSIONS_5',
          name: 'Thêm 5 lượt submit',
          description: 'Tặng thêm 5 lượt submit trong ngày (demo).',
          category: 'Utilities',
          type: 'utility',
          priceCoins: 80,
          imageUrl: '/component_2_2x.png',
          tags: ['quota', 'submit'],
          isActive: true,
        },
        {
          sku: 'NAME_TAG_GOLD',
          name: 'Gold Name Tag',
          description: 'Tên hiển thị có viền vàng trong forum/battle (demo).',
          category: 'Cosmetics',
          type: 'cosmetic',
          priceCoins: 220,
          imageUrl: '/component_2_2x.png',
          tags: ['badge'],
          isActive: true,
        },
      ]);
    }

    const welcome = await this.couponModel
      .findOne({ code: 'WELCOME100' })
      .lean()
      .exec();
    if (!welcome) {
      await this.couponModel.create({
        code: 'WELCOME100',
        coinsBonus: 100,
        isActive: true,
      });
    }
  }

  async listItems(query: ListItemsQuery) {
    const filter: Record<string, unknown> = { isActive: true };
    if (query.category) filter.category = query.category;
    if (query.search) {
      filter.$or = [
        { name: new RegExp(query.search, 'i') },
        { sku: new RegExp(query.search, 'i') },
        { tags: new RegExp(query.search, 'i') },
      ];
    }

    const sort: Record<string, 1 | -1> =
      query.sort === 'priceAsc'
        ? { priceCoins: 1 }
        : query.sort === 'priceDesc'
          ? { priceCoins: -1 }
          : { createdAt: -1 };

    return this.itemModel.find(filter).sort(sort).lean().exec();
  }

  async listCategories() {
    const categories = await this.itemModel
      .distinct('category', { isActive: true })
      .exec();
    return categories.sort((a, b) => String(a).localeCompare(String(b)));
  }

  private toObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    return new Types.ObjectId(id);
  }

  private async getOrCreateUserDemo(userId: Types.ObjectId) {
    const existing = await this.userModel.findById(userId).exec();
    if (existing) return existing;
    // demo fallback: tạo user nếu chưa có (tránh crash khi chạy local)
    return this.userModel.create({
      _id: userId,
      username: 'demo-user',
      email: 'demo@codeforglory.local',
      isFirstLogin: false,
      gamification: { coins: 500, xp: 0, level: 1 },
    });
  }

  async getMe(userId: Types.ObjectId) {
    const user = await this.getOrCreateUserDemo(userId);
    const coins = user.gamification?.coins ?? 0;

    const inventory = await this.inventoryModel
      .find({ userId })
      .populate('itemId')
      .lean()
      .exec();

    const purchases = await this.purchaseModel
      .find({ userId })
      .sort({ createdAt: -1, _id: -1 })
      .limit(50)
      .lean()
      .exec();

    const lastClaim = user.gamification?.lastDailyClaimAt;
    const canClaimDailyReward =
      !lastClaim || Date.now() - new Date(lastClaim).getTime() >= ONE_DAY_MS;

    return {
      coins,
      canClaimDailyReward,
      lastDailyClaimAt: lastClaim ?? null,
      inventory: inventory.map((row) => ({
        id: String(row._id),
        quantity: row.quantity,
        lastUsedAt: row.lastUsedAt ?? null,
        item: row.itemId && typeof row.itemId === 'object' ? row.itemId : null,
      })),
      purchases: purchases.map((p) => ({
        id: String(p._id),
        totalCoins: p.totalCoins,
        // `createdAt` đến từ timestamps, nhưng type của mongoose không tự suy ra
        createdAt: (p as unknown as { createdAt?: Date }).createdAt ?? null,
        items: p.items,
      })),
    };
  }

  async claimDailyReward(userId: Types.ObjectId) {
    const user = await this.getOrCreateUserDemo(userId);
    const lastClaim = user.gamification?.lastDailyClaimAt;
    if (
      lastClaim &&
      Date.now() - new Date(lastClaim).getTime() < ONE_DAY_MS
    ) {
      throw new BadRequestException('Bạn đã nhận thưởng hôm nay rồi.');
    }

    const rewardCoins = 120;
    user.gamification.coins = (user.gamification.coins ?? 0) + rewardCoins;
    user.gamification.lastDailyClaimAt = new Date();
    await user.save();

    return { coins: user.gamification.coins, rewardCoins };
  }

  async redeemCoupon(userId: Types.ObjectId, code: string) {
    const normalized = code.trim().toUpperCase();
    const coupon = await this.couponModel
      .findOne({ code: normalized, isActive: true })
      .exec();
    if (!coupon) throw new NotFoundException('Mã không tồn tại hoặc đã tắt.');
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Mã đã hết hạn.');
    }

    const couponId = coupon._id as Types.ObjectId;

    // chặn reuse theo user
    const already = await this.redemptionModel
      .findOne({ couponId, userId })
      .lean()
      .exec();
    if (already) throw new BadRequestException('Bạn đã dùng mã này rồi.');

    await this.redemptionModel.create({ couponId, userId });

    const user = await this.getOrCreateUserDemo(userId);
    user.gamification.coins = (user.gamification.coins ?? 0) + coupon.coinsBonus;
    await user.save();

    return { coins: user.gamification.coins, bonus: coupon.coinsBonus };
  }

  async checkout(userId: Types.ObjectId, items: { itemId: string; quantity: number }[]) {
    if (!items || items.length === 0) {
      throw new BadRequestException('Giỏ hàng trống.');
    }

    const parsed = items.map((line) => ({
      itemId: this.toObjectId(line.itemId),
      quantity: Math.max(1, Math.floor(line.quantity)),
    }));

    const uniqueItemIds = [...new Set(parsed.map((x) => String(x.itemId)))].map(
      (x) => new Types.ObjectId(x)
    );

    const dbItems = await this.itemModel
      .find({ _id: { $in: uniqueItemIds }, isActive: true })
      .lean()
      .exec();

    if (dbItems.length !== uniqueItemIds.length) {
      throw new BadRequestException('Có item không tồn tại hoặc đã bị tắt.');
    }

    const itemById = new Map(dbItems.map((it) => [String(it._id), it]));

    const purchaseLines = parsed.map((line) => {
      const it = itemById.get(String(line.itemId));
      if (!it) throw new BadRequestException('Item không hợp lệ.');
      return {
        itemId: line.itemId,
        sku: it.sku,
        name: it.name,
        unitPriceCoins: it.priceCoins,
        quantity: line.quantity,
      };
    });

    const totalCoins = purchaseLines.reduce(
      (sum, l) => sum + l.unitPriceCoins * l.quantity,
      0
    );

    const user = await this.getOrCreateUserDemo(userId);
    const currentCoins = user.gamification?.coins ?? 0;
    if (currentCoins < totalCoins) {
      throw new BadRequestException('Không đủ coin.');
    }

    // deduct coins
    user.gamification.coins = currentCoins - totalCoins;
    await user.save();

    // write purchase
    const createdPurchase = await this.purchaseModel.create({
      userId,
      totalCoins,
      items: purchaseLines,
    });

    // update inventory
    const bulk = purchaseLines.map((line) => ({
      updateOne: {
        filter: { userId, itemId: line.itemId },
        update: { $inc: { quantity: line.quantity } },
        upsert: true,
      },
    }));
    await this.inventoryModel.bulkWrite(bulk);

    return {
      coins: user.gamification.coins,
      purchaseId: String(createdPurchase._id),
      totalCoins,
    };
  }

  async useInventoryItem(userId: Types.ObjectId, inventoryId: string) {
    const invId = this.toObjectId(inventoryId);
    const inv = await this.inventoryModel.findOne({ _id: invId, userId }).exec();
    if (!inv) throw new NotFoundException('Không tìm thấy item trong kho.');
    if (inv.quantity <= 0) throw new BadRequestException('Item đã hết.');

    inv.quantity -= 1;
    inv.lastUsedAt = new Date();
    await inv.save();

    return { ok: true, remaining: inv.quantity };
  }
}
