import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { CodeAnalysisController } from './code-analysis.controller';
import { CodeAnalysisService } from './code-analysis.service';

import {
  CodeAnalysis,
  CodeAnalysisSchema,
} from './schemas/code-analysis.schema';
import { Battle, BattleSchema } from '../battles/schemas/battle.schema';

import { AI_PROVIDER } from './interfaces/ai-provider.interface';
// import { MockAiProvider } from './providers/mock-ai.provider';
// import { GeminiAiProvider } from './providers/gemini-ai.provider';
import { GroqAiProvider } from './providers/groq-ai.provider';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: CodeAnalysis.name, schema: CodeAnalysisSchema },
      { name: Battle.name, schema: BattleSchema },
    ]),
  ],
  controllers: [CodeAnalysisController],
  providers: [
    CodeAnalysisService,
    {
      provide: AI_PROVIDER,
      useClass: GroqAiProvider,
      // useClass: GeminiAiProvider,
    },
  ],
})
export class CodeAnalysisModule {}
