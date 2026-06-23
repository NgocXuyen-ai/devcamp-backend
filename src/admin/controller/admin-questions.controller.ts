import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import {
  CreateQuestionDto,
  QuestionFilterDto,
} from '../../exercises/dto/question.dto';
import { BulkImportQuestionsDto } from '../dto/admin-config.dto';
import { AdminQuestionsService } from '../service/admin-questions.service';

class PublishDto {
  isPublished!: boolean;
}

@ApiTags('Admin · Questions')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/questions')
export class AdminQuestionsController {
  constructor(private readonly service: AdminQuestionsService) {}

  @Get()
  @ApiOperation({
    summary: 'List ALL questions (kể cả unpublished) với filter + pagination',
  })
  list(@Query() q: QuestionFilterDto) {
    return this.service.list(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail (kèm answer key cho admin)' })
  get(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create question' })
  create(
    @Body() dto: CreateQuestionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(dto, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update question' })
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: Partial<CreateQuestionDto>,
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish / unpublish a question' })
  publish(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: PublishDto,
  ) {
    return this.service.setPublished(id, dto.isPublished);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete question' })
  async remove(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ): Promise<void> {
    await this.service.remove(id);
  }

  @Post('bulk-import')
  @ApiOperation({
    summary: 'Bulk import questions (JSON array, max 500)',
    description:
      'Returns counts of inserted / skipped (duplicates) / failed items.',
  })
  bulkImport(
    @Body() dto: BulkImportQuestionsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.bulkImport(dto, user.userId);
  }
}
