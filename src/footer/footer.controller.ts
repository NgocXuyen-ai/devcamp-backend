import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { RolesGuard } from '../common/guard/roles.guard';
import { FooterLocaleQueryDto, UpdateFooterDto } from './dto/footer.dto';
import { FooterService } from './footer.service';

@ApiTags('Footer')
@Controller('public/footer')
export class PublicFooterController {
  constructor(private readonly footerService: FooterService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get localized public footer configuration' })
  getFooter(@Query() query: FooterLocaleQueryDto) {
    return this.footerService.getPublicFooter(query.locale);
  }
}

@ApiTags('Admin - Footer')
@ApiBearerAuth()
@Controller('admin/footer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminFooterController {
  constructor(private readonly footerService: FooterService) {}

  @Get()
  @ApiOperation({ summary: 'Get the complete bilingual footer configuration' })
  getConfig() {
    return this.footerService.getAdminConfig();
  }

  @Put()
  @ApiOperation({ summary: 'Create or replace the footer configuration' })
  update(
    @Body() dto: UpdateFooterDto,
    @CurrentUser('userId') userId: Types.ObjectId,
  ) {
    return this.footerService.update(dto, userId);
  }
}
