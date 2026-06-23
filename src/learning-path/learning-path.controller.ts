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
import { LearningPathService } from './learning-path.service';
import { CreateLearningPathDto } from './dto/create-learning-path.dto';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

type JwtUser = { userId?: string | Types.ObjectId } | null;

/** Lấy userId từ JWT nếu có, fallback demo user để chạy local không cần đăng nhập. */
function getUserIdFromReq(req: Request): Types.ObjectId {
  const jwtUser = (req as unknown as { user?: JwtUser }).user;
  const raw = jwtUser?.userId;
  if (raw && Types.ObjectId.isValid(raw)) return new Types.ObjectId(raw);
  return new Types.ObjectId('507f1f77bcf86cd799439011');
}

@Controller('learning-paths')
export class LearningPathController {
  constructor(private readonly learningPathService: LearningPathService) {}

  @Post()
  async createPath(@Body() dto: CreateLearningPathDto) {
    return this.learningPathService.createPath(dto);
  }

  @Get()
  async findAllPaths() {
    return this.learningPathService.findAllPaths();
  }

  @Get(':id')
  async findPathById(@Param('id') id: string) {
    return this.learningPathService.findPathById(id);
  }

  @Post(':id/nodes')
  async addNode(@Param('id') id: string, @Body() dto: CreateNodeDto) {
    return this.learningPathService.addNode(id, dto);
  }

  @Get(':id/nodes')
  async getNodes(@Param('id') id: string) {
    return this.learningPathService.getNodes(id);
  }

  @Post('nodes/:nodeId/progress')
  @UseGuards(OptionalJwtAuthGuard)
  updateProgress(
    @Req() req: Request,
    @Param('nodeId') nodeId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.learningPathService.updateProgress(
      getUserIdFromReq(req),
      nodeId,
      dto,
    );
  }

  @Get(':id/my-progress')
  @UseGuards(OptionalJwtAuthGuard)
  getMyProgress(@Req() req: Request, @Param('id') pathId: string) {
    return this.learningPathService.getMyProgress(
      getUserIdFromReq(req),
      pathId,
    );
  }
}
