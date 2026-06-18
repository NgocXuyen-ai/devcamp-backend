import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { AnswerRecallTestDto } from './dto/answer-recall-test.dto';
import { CreateRecallTestDto } from './dto/create-recall-test.dto';
import { ReviewRecallDto } from './dto/review-recall.dto';
import { RecallService } from './recall.service';

@ApiTags('Recall')
@Controller('me')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecallController {
  constructor(private readonly recallService: RecallService) {}

  @Get('recall/due')
  @ApiOperation({ summary: 'Get recall items due for the current user' })
  getDueRecallItems(@CurrentUser('userId') userId: Types.ObjectId) {
    return this.recallService.getDueRecallItems(userId);
  }

  @Post('recall/:id/review')
  @ApiOperation({ summary: 'Review one recall item using SM-2 quality score' })
  reviewRecallItem(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Param('id') recallId: string,
    @Body() dto: ReviewRecallDto,
  ) {
    return this.recallService.reviewRecallItem(userId, recallId, dto);
  }

  @Post('recall-tests')
  @ApiOperation({ summary: 'Create a recall test for a locked node' })
  createRecallTest(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Body() dto: CreateRecallTestDto,
  ) {
    return this.recallService.createRecallTest(userId, dto);
  }

  @Post('recall-tests/:id/answer')
  @ApiOperation({ summary: 'Save one answer in a recall test' })
  answerRecallTest(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Param('id') testId: string,
    @Body() dto: AnswerRecallTestDto,
  ) {
    return this.recallService.answerRecallTest(userId, testId, dto);
  }

  @Post('recall-tests/:id/submit')
  @ApiOperation({ summary: 'Submit and finalize a recall test' })
  submitRecallTest(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Param('id') testId: string,
  ) {
    return this.recallService.submitRecallTest(userId, testId);
  }
}
