import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '../users/schemas/users.schema';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { ShopItem, ShopItemSchema } from './schemas/shop-item.schema';
import {
  ShopInventoryItem,
  ShopInventorySchema,
} from './schemas/shop-inventory.schema';
import {
  ShopPurchase,
  ShopPurchaseSchema,
} from './schemas/shop-purchase.schema';
import { ShopCoupon, ShopCouponSchema } from './schemas/shop-coupon.schema';
import {
  ShopCouponRedemption,
  ShopCouponRedemptionSchema,
} from './schemas/shop-coupon-redemption.schema';
import { NotificationsModule } from '../notifications/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ShopItem.name, schema: ShopItemSchema },
      { name: ShopInventoryItem.name, schema: ShopInventorySchema },
      { name: ShopPurchase.name, schema: ShopPurchaseSchema },
      { name: ShopCoupon.name, schema: ShopCouponSchema },
      { name: ShopCouponRedemption.name, schema: ShopCouponRedemptionSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule { }