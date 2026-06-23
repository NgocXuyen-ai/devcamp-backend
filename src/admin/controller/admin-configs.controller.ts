import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { Types } from 'mongoose';
import { ConfigListQueryDto, UpsertConfigDto } from '../dto/admin-config.dto';
import { AdminConfigService } from '../service/admin-configs.service';

@ApiTags('Admin · Configs')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/configs')
export class AdminConfigsController {
  constructor(private readonly service: AdminConfigService) {}

  @Get()
  @ApiOperation({
    summary: 'List configs across scopes (filter by scope/isActive)',
  })
  list(@Query() q: ConfigListQueryDto) {
    return this.service.list(q);
  }

  @Get(':scope/:key')
  @ApiOperation({ summary: 'Get one config by (scope, key)' })
  get(@Param('scope') scope: string, @Param('key') key: string) {
    return this.service.findOne(scope, key);
  }

  @Put(':scope/:key')
  @ApiOperation({
    summary:
      'Upsert config — auto increments version + records updatedBy in audit',
  })
  upsert(
    @Param('scope') scope: string,
    @Param('key') key: string,
    @Body() dto: UpsertConfigDto,
    @CurrentUser('userId') actorId: Types.ObjectId,
  ) {
    return this.service.upsert(scope, key, {
      value: dto.value,
      description: dto.description,
      isActive: dto.isActive,
      updatedBy: actorId,
    });
  }

  @Delete(':scope/:key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete config' })
  async remove(
    @Param('scope') scope: string,
    @Param('key') key: string,
  ): Promise<void> {
    await this.service.remove(scope, key);
  }
}
