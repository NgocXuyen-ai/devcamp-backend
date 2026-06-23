import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import {
  CareerPathDto,
  DisciplineDto,
  SkillTestStartDto,
  SkillTestSubmitDto,
} from './dto/survey.dto';
import { SurveyService } from './service/survey.service';

@ApiTags('Survey')
@Controller('survey')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SurveyController {
  constructor(private readonly survey: SurveyService) {}

  // Segment 1
  @Post('career-path')
  @ApiOperation({ summary: 'Lưu Phân đoạn 1 — Career Path' })
  saveCareerPath(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Body() dto: CareerPathDto,
  ) {
    return this.survey.saveCareerPath(userId, dto);
  }

  // Segment 2 — coding mini test
  @Post('skill-test/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy 1–3 bài coding mini test (JS) theo field' })
  startSkillTest(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Body() dto: SkillTestStartDto,
  ) {
    return this.survey.startSkillTest(userId, dto);
  }

  @Post('skill-test/submit')
  @ApiOperation({
    summary: 'Nộp code, server chấm bằng test cases và tính entry level',
  })
  submitSkillTest(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Body() dto: SkillTestSubmitDto,
  ) {
    return this.survey.submitSkillTest(userId, dto);
  }

  // Segment 3
  @Post('discipline')
  @ApiOperation({ summary: 'Lưu Phân đoạn 3 — Discipline & Penalty Setup' })
  saveDiscipline(
    @CurrentUser('userId') userId: Types.ObjectId,
    @Body() dto: DisciplineDto,
  ) {
    return this.survey.saveDiscipline(userId, dto);
  }

  // Finalize
  @Post('complete')
  @ApiOperation({
    summary: 'Hoàn tất survey, project xuống User + tính entry level',
  })
  complete(@CurrentUser('userId') userId: Types.ObjectId) {
    return this.survey.complete(userId);
  }

  // Read
  @Get('me')
  @ApiOperation({ summary: 'Lấy bản survey mới nhất của user' })
  getMine(@CurrentUser('userId') userId: Types.ObjectId) {
    return this.survey.getLatest(userId);
  }

  @Post('retake')
  @ApiOperation({ summary: 'Tạo bản version+1 (sau 1 tháng học)' })
  retake(@CurrentUser('userId') userId: Types.ObjectId) {
    return this.survey.retake(userId);
  }
}
