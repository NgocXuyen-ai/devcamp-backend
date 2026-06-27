import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CodeAnalysisDocument = HydratedDocument<CodeAnalysis>;

export type AnalysisStatus = 'pending' | 'completed' | 'failed';

@Schema({ _id: false })
export class AnalysisResource {
  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: true })
  url!: string;
}
export const AnalysisResourceSchema =
  SchemaFactory.createForClass(AnalysisResource);

@Schema({ timestamps: true })
export class CodeAnalysis {
  @Prop({ type: Types.ObjectId, ref: 'Battle', required: true, index: true })
  battleId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  code!: string;

  @Prop({ type: String, default: 'javascript' })
  language!: string;

  @Prop({ type: String, default: '' })
  summary!: string;

  @Prop({ type: [String], default: [] })
  strengths!: string[];

  @Prop({ type: [String], default: [] })
  improvements!: string[];

  @Prop({ type: String, default: '' })
  refactoringSuggestion!: string;

  @Prop({ type: [AnalysisResourceSchema], default: [] })
  resources!: AnalysisResource[];

  @Prop({
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  })
  status!: AnalysisStatus;
}

export const CodeAnalysisSchema = SchemaFactory.createForClass(CodeAnalysis);

CodeAnalysisSchema.index({ battleId: 1, userId: 1 }, { unique: true });
