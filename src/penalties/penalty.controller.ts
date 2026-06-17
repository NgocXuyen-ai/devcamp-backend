import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { PenaltiesService } from './penalty.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class PenaltiesController {
  constructor(private readonly penaltiesService: PenaltiesService) {}

  @Get('penalties')
  async getMyActivePenalties(@CurrentUser() user: { userId: string }) {
    const data = await this.penaltiesService.getMyActivePenalties(user.userId);
    return { success: true, data };
  }

  @Get('penalties/node/:nodeId')
  async checkNodePenaltyStatus(
    @CurrentUser() user: { userId: string },
    @Param('nodeId') nodeId: string,
  ) {
    const data: Record<string, unknown> =
      await this.penaltiesService.checkNodePenaltyStatus(user.userId, nodeId);
    return { success: true, data };
  }

  @Post('penalties/:id/start-recall')
  async startRecallTest(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    const result = await this.penaltiesService.startRecallTest(user.userId, id);
    return { success: true, ...result };
  }
}
