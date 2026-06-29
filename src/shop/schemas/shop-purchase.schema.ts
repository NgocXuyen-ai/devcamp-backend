import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ShopPurchaseDocument = HydratedDocument<ShopPurchase>;

@Schema({ _id: false })
export class ShopPurchaseLine {
  @Prop({ type: Types.ObjectId, ref: 'ShopItem', required: true })
  itemId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  sku!: string;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: Number, required: true })
  unitPriceCoins!: number;

  @Prop({ type: Number, required: true, min: 1 })
  quantity!: number;
}

@Schema({ timestamps: true })
export class ShopPurchase {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: [ShopPurchaseLine], default: [] })
  items!: ShopPurchaseLine[];

  @Prop({ type: Number, required: true, min: 0 })
  totalCoins!: number;
}

export const ShopPurchaseSchema = SchemaFactory.createForClass(ShopPurchase);

ShopPurchaseSchema.index({ userId: 1, createdAt: -1 });
