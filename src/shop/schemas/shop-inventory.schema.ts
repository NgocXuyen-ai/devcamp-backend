import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ShopInventoryDocument = HydratedDocument<ShopInventoryItem>;

@Schema({ timestamps: true })
export class ShopInventoryItem {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ShopItem', required: true, index: true })
  itemId!: Types.ObjectId;

  @Prop({ type: Number, default: 0, min: 0 })
  quantity!: number;

  @Prop({ type: Date })
  lastUsedAt?: Date;
}

export const ShopInventorySchema =
  SchemaFactory.createForClass(ShopInventoryItem);

ShopInventorySchema.index({ userId: 1, itemId: 1 }, { unique: true });

