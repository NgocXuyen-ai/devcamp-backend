import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ShopCouponDocument = HydratedDocument<ShopCoupon>;

@Schema({ timestamps: true })
export class ShopCoupon {
  @Prop({
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  })
  code!: string;

  @Prop({ type: Number, required: true, min: 0 })
  coinsBonus!: number;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Date })
  expiresAt?: Date;
}

export const ShopCouponSchema = SchemaFactory.createForClass(ShopCoupon);
