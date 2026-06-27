import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Types } from 'mongoose';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CodeAnalysisService } from './code-analysis.service';
import { CreateAnalysisDto } from './dto/code-analysis.dto';

type JwtUser = { userId?: string | Types.ObjectId } | null;

/** Resolve the user id from JWT, falling back to a demo user for local dev. */
function getUserIdFromReq(req: Request): Types.ObjectId {
  const jwtUser = (req as unknown as { user?: JwtUser }).user;
  const raw = jwtUser?.userId;
  if (raw && Types.ObjectId.isValid(raw)) return new Types.ObjectId(raw);
  return new Types.ObjectId('64b000000000000000000001');
}

@ApiTags('Code Analysis')
@Controller('code-analysis')
@UseGuards(OptionalJwtAuthGuard)
export class CodeAnalysisController {
  constructor(private readonly analysis: CodeAnalysisService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateAnalysisDto) {
    return this.analysis.create(
      getUserIdFromReq(req),
      dto.battleId,
      dto.code,
      dto.language,
    );
  }

  @Get(':battleId')
  getByBattle(@Req() req: Request, @Param('battleId') battleId: string) {
    return this.analysis.getByBattle(getUserIdFromReq(req), battleId);
  }
}
