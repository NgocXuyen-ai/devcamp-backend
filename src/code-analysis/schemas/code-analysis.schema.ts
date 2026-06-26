import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CodeAnalysisDocument = CodeAnalysis & Document;

@Schema({ _id: false })
export class AnalysisResource {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  url!: string;
}

@Schema({ timestamps: true })
export class CodeAnalysis {
  @Prop({ type: Types.ObjectId, ref: 'Battle', required: true })
  battleId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', require: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  code!: string;

  @Prop({ required: true })
  language!: string;

  @Prop({
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  })
  status!: string;

  @Prop()
  summary?: string;

  @Prop({ type: [String], default: [] })
  strengths!: string[];

  @Prop({ type: [String], default: [] })
  improvements!: string[];

  @Prop()
  refactoringSuggestion?: string;

  @Prop({ type: [AnalysisResource], default: [] })
  resources!: AnalysisResource[];

  @Prop()
  aiModel?: string;

  @Prop()
  modelVersion?: string;
}

export const CodeAnalysisSchema = SchemaFactory.createForClass(CodeAnalysis);

CodeAnalysisSchema.index({ userId: 1 });
CodeAnalysisSchema.index({ battleId: 1, userId: 1 }, { unique: true });
