import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ShopItemDocument = HydratedDocument<ShopItem>;

export type ShopItemType = 'cosmetic' | 'booster' | 'utility';

@Schema({ timestamps: true })
export class ShopItem {
  @Prop({ type: String, required: true, unique: true, trim: true })
  sku!: string; // ví dụ: BOOST_XP_1H

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: true, trim: true })
  description!: string;

  @Prop({ type: String, required: true, trim: true })
  category!: string; // ví dụ: Boosters, Cosmetics, Utilities

  @Prop({ type: String, required: true, default: 'utility' })
  type!: ShopItemType;

  @Prop({ type: Number, required: true, min: 0 })
  priceCoins!: number;

  @Prop({ type: String })
  imageUrl?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Number })
  stock?: number; // nếu undefined => không giới hạn
}

export const ShopItemSchema = SchemaFactory.createForClass(ShopItem);

