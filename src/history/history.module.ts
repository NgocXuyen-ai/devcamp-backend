import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import {
  LearningHistory,
  LearningHistorySchema,
} from './schemas/learning-history.schema';
import { Bookmark, BookmarkSchema } from './schemas/bookmark.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LearningHistory.name, schema: LearningHistorySchema },
      { name: Bookmark.name, schema: BookmarkSchema },
    ]),
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
