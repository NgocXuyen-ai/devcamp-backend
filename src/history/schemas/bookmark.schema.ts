import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BookmarkDocument = HydratedDocument<Bookmark>;

@Schema({ timestamps: true })
export class Bookmark {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RoadmapNode' })
  nodeId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Question' })
  questionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Exercise' })
  exerciseId?: Types.ObjectId;

  @Prop({ type: String })
  note?: string; // user's personal note about why they saved it

  @Prop({ type: [String], default: [] })
  tags!: string[]; // custom tags for personal organisation
}

export const BookmarkSchema = SchemaFactory.createForClass(Bookmark);

BookmarkSchema.index({ userId: 1, createdAt: -1 });
BookmarkSchema.index({ userId: 1, nodeId: 1 }, { sparse: true });
BookmarkSchema.index({ userId: 1, questionId: 1 }, { sparse: true });
BookmarkSchema.index({ userId: 1, exerciseId: 1 }, { sparse: true });
