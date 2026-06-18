import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Types } from 'mongoose';

import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { ShopService } from './shop.service';
import { CheckoutDto } from './dto/checkout.dto';
import { RedeemCouponDto } from './dto/redeem-coupon.dto';

type JwtUser = { userId: string; email: string; role: string } | null;

function getUserIdFromReq(req: Request): Types.ObjectId {
  const jwtUser = (req as unknown as { user?: JwtUser }).user;
  const raw = jwtUser?.userId;
  if (raw && Types.ObjectId.isValid(raw)) return new Types.ObjectId(raw);

  // fallback demo user
  return new Types.ObjectId('64b000000000000000000001');
}

@Controller('shop')
@UseGuards(OptionalJwtAuthGuard)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('items')
  listItems(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: 'priceAsc' | 'priceDesc' | 'newest'
  ) {
    return this.shopService.listItems({ search, category, sort });
  }

  @Get('categories')
  categories() {
    return this.shopService.listCategories();
  }

  @Get('me')
  me(@Req() req: Request) {
    return this.shopService.getMe(getUserIdFromReq(req));
  }

  @Post('checkout')
  checkout(@Req() req: Request, @Body() dto: CheckoutDto) {
    return this.shopService.checkout(getUserIdFromReq(req), dto.items);
  }

  @Post('daily-reward')
  dailyReward(@Req() req: Request) {
    return this.shopService.claimDailyReward(getUserIdFromReq(req));
  }

  @Post('redeem')
  redeem(@Req() req: Request, @Body() dto: RedeemCouponDto) {
    return this.shopService.redeemCoupon(getUserIdFromReq(req), dto.code);
  }

  @Post('inventory/use')
  useItem(@Req() req: Request, @Body() body: { inventoryId: string }) {
    return this.shopService.useInventoryItem(
      getUserIdFromReq(req),
      body.inventoryId
    );
  }
}

