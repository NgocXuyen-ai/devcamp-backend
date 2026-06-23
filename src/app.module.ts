import { Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LearningPathModule } from './learning-path/learning-path.module';
import { BattlesModule } from './battles/battles.module';
import { RecallModule } from './recall/recall.module';
import { AIMentorModule } from './ai-mentor/ai-mentor.module';
import { PenaltiesModule } from './penalties/penalty.module';
import { ExercisesModule } from './exercises/exercises.module';
import { ErrorTrackingModule } from './error-tracking/error-tracking.module';
import { HistoryModule } from './history/history.module';
import { NotificationsModule } from './notifications/notification.module';
import { SurveyModule } from './survey/survey.module';
import { AdminModule } from './admin/admin.module';
import { CommonModule } from './common/common.module';
import { ShopModule } from './shop/shop.module';

let memoryMongoServer: MongoMemoryServer | null = null;
const persistentMongoPath = join(process.cwd(), '.local-data', 'mongodb');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const isJest = typeof process.env.JEST_WORKER_ID !== 'undefined';
        let uri =
          config.get<string>('MONGODB_URI') || config.get<string>('MONGO_URI');

        if (!uri) {
          if (!isJest) {
            mkdirSync(persistentMongoPath, { recursive: true });
          }
          memoryMongoServer ??= await MongoMemoryServer.create({
            instance: {
              dbName: 'code-for-glory',
              ...(isJest ? {} : { dbPath: persistentMongoPath }),
            },
          });
          uri = memoryMongoServer.getUri();
        }

        return {
          uri,
          dbName: 'code-for-glory',
          retryAttempts: 0,
          serverSelectionTimeoutMS: 1000,
        };
      },
    }),

    CommonModule,

    AuthModule,
    UsersModule,

    LearningPathModule,
    ExercisesModule,
    BattlesModule,
    RecallModule,

    AIMentorModule,
    PenaltiesModule,

    ErrorTrackingModule,
    HistoryModule,
    NotificationsModule,
    SurveyModule,
    AdminModule,
    ShopModule,
  ],
})
export class AppModule implements OnApplicationShutdown {
  async onApplicationShutdown() {
    if (memoryMongoServer) {
      await memoryMongoServer.stop();
      memoryMongoServer = null;
    }
  }
}
