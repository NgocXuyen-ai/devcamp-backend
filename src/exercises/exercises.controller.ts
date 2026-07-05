import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Types } from 'mongoose';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { ExercisesService } from './exercises.service';
import { PracticeEvaluationDto } from './dto/practice-evaluation.dto';

type JwtUser = { userId?: string | Types.ObjectId } | null;

/** Lấy userId từ JWT nếu có, fallback demo user để chạy local không cần đăng nhập. */
function getUserIdFromReq(req: Request): Types.ObjectId {
  const jwtUser = (req as unknown as { user?: JwtUser }).user;
  const raw = jwtUser?.userId;
  if (raw && Types.ObjectId.isValid(raw)) return new Types.ObjectId(raw);
  return new Types.ObjectId('64b000000000000000000001');
}

@Controller('exercises')
@UseGuards(OptionalJwtAuthGuard)
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post('run')
  run(@Body() dto: PracticeEvaluationDto) {
    return this.exercisesService.run(dto);
  }

  @Post('submit')
  submit(@Req() req: Request, @Body() dto: PracticeEvaluationDto) {
    return this.exercisesService.submit(getUserIdFromReq(req), dto);
  }

  @Get('progress-summary')
  getProgressSummary(@Req() req: Request) {
    return this.exercisesService.getProgressSummary(getUserIdFromReq(req));
  }

  @Get(':practiceId/submissions')
  getSubmissions(@Req() req: Request, @Param('practiceId') practiceId: string) {
    return this.exercisesService.getSubmissions(
      getUserIdFromReq(req),
      practiceId,
    );
  }
}
