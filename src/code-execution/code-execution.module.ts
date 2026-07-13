import { Module } from '@nestjs/common';
import { CodeExecutionService } from './code-execution.service';
import { CodeJudgeService } from './code-judge.service';

@Module({
  providers: [CodeExecutionService, CodeJudgeService],
  exports: [CodeExecutionService, CodeJudgeService],
})
export class CodeExecutionModule {}
