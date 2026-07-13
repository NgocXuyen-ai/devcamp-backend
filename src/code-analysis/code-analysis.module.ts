import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CodeAnalysisController } from './code-analysis.controller';
import { CodeAnalysisService } from './code-analysis.service';
import { GroqAnalysisProvider } from './providers/groq-analysis.provider';
import {
  CodeAnalysis,
  CodeAnalysisSchema,
} from './schemas/code-analysis.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: CodeAnalysis.name, schema: CodeAnalysisSchema },
    ]),
  ],
  controllers: [CodeAnalysisController],
  providers: [CodeAnalysisService, GroqAnalysisProvider],
  exports: [CodeAnalysisService],
})
export class CodeAnalysisModule {}
