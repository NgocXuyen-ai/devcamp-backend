import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CodeAnalysisController } from './code-analysis.controller';
import { CodeAnalysisService } from './code-analysis.service';
import {
  CodeAnalysis,
  CodeAnalysisSchema,
} from './schemas/code-analysis.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CodeAnalysis.name, schema: CodeAnalysisSchema },
    ]),
  ],
  controllers: [CodeAnalysisController],
  providers: [CodeAnalysisService],
  exports: [CodeAnalysisService],
})
export class CodeAnalysisModule {}
