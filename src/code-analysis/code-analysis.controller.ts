import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CodeAnalysisService } from './code-analysis.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { CurrentUser } from '../battles/decorators/current-user.decorator';
// import { User } from '../users/schemas/users.schema';

@Controller('code-analysis')
@UseGuards(JwtAuthGuard)
export class CodeAnalysisController {
  constructor(private readonly codeAnalysisService: CodeAnalysisService) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateAnalysisDto,
  ) {
    return this.codeAnalysisService.createAnalysis(user.userId, dto);
  }

  @Get(':battleId')
  getByBattleId(
    @Param('battleId') battleId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.codeAnalysisService.getAnalysisByBattleId(
      battleId,
      user.userId,
    );
  }
}
