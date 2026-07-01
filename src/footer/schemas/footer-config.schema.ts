import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FooterConfigDocument = HydratedDocument<FooterConfig>;

@Schema({ _id: false })
export class LocalizedText {
  @Prop({ type: String, required: true })
  en!: string;

  @Prop({ type: String, required: true })
  vi!: string;
}

const LocalizedTextSchema = SchemaFactory.createForClass(LocalizedText);

@Schema({ _id: false })
export class FooterLink {
  @Prop({ type: LocalizedTextSchema, required: true })
  label!: LocalizedText;

  @Prop({ type: String, required: true })
  url!: string;

  @Prop({ type: Boolean, default: false })
  external!: boolean;

  @Prop({ type: String })
  icon?: string;

  @Prop({ type: Boolean, default: true })
  enabled!: boolean;

  @Prop({ type: Number, default: 0 })
  order!: number;
}

const FooterLinkSchema = SchemaFactory.createForClass(FooterLink);

@Schema({ _id: false })
export class FooterSection {
  @Prop({ type: LocalizedTextSchema, required: true })
  title!: LocalizedText;

  @Prop({ type: [FooterLinkSchema], default: [] })
  links!: FooterLink[];

  @Prop({ type: Number, default: 0 })
  order!: number;
}

const FooterSectionSchema = SchemaFactory.createForClass(FooterSection);

@Schema({ _id: false })
export class FooterBrand {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: LocalizedTextSchema, required: true })
  tagline!: LocalizedText;

  @Prop({ type: String, required: true })
  logoUrl!: string;
}

const FooterBrandSchema = SchemaFactory.createForClass(FooterBrand);

@Schema({ timestamps: true })
export class FooterConfig {
  @Prop({ type: String, required: true, default: 'main' })
  key!: string;

  @Prop({ type: FooterBrandSchema, required: true })
  brand!: FooterBrand;

  @Prop({ type: [FooterSectionSchema], default: [] })
  sections!: FooterSection[];

  @Prop({ type: [FooterLinkSchema], default: [] })
  socialLinks!: FooterLink[];

  @Prop({ type: [FooterLinkSchema], default: [] })
  legalLinks!: FooterLink[];

  @Prop({ type: LocalizedTextSchema, required: true })
  copyright!: LocalizedText;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const FooterConfigSchema = SchemaFactory.createForClass(FooterConfig);

FooterConfigSchema.index({ key: 1 }, { unique: true });
