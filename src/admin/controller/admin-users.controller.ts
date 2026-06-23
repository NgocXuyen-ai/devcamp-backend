import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import {
  AdminUpdateUserDto,
  AdminUserListQueryDto,
} from '../dto/admin-user.dto';
import { AdminUsersService } from '../service/admin-users.service';

@ApiTags('Admin · Users')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users với search + filter + pagination' })
  list(@Query() q: AdminUserListQueryDto) {
    return this.service.list(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết user (admin view)' })
  get(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật role / lock state' })
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: AdminUpdateUserDto,
    @CurrentUser('userId') actorId: Types.ObjectId,
  ) {
    return this.service.update(id, dto, actorId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete (khoá vĩnh viễn)' })
  async remove(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser('userId') actorId: Types.ObjectId,
  ): Promise<void> {
    await this.service.softDelete(id, actorId);
  }
}
