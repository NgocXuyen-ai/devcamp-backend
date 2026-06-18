import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ShopCouponRedemptionDocument =
  HydratedDocument<ShopCouponRedemption>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class ShopCouponRedemption {
  @Prop({ type: Types.ObjectId, ref: 'ShopCoupon', required: true, index: true })
  couponId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;
}

export const ShopCouponRedemptionSchema =
  SchemaFactory.createForClass(ShopCouponRedemption);

ShopCouponRedemptionSchema.index({ couponId: 1, userId: 1 }, { unique: true });

