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
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import {
  CreateNodeDto,
  CreateRoadmapDto,
  MilestoneDto,
  NodeListQueryDto,
  PublishNodeDto,
  RoadmapListQueryDto,
  UpdateNodeDto,
  UpdateRoadmapDto,
} from '../dto/admin-roadmap.dto';
import { AdminRoadmapsService } from '../service/admin-roadmaps.service';

@ApiTags('Admin · Roadmaps')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/roadmaps')
export class AdminRoadmapsController {
  constructor(private readonly service: AdminRoadmapsService) {}

  // ===== Roadmap CRUD =====

  @Get()
  @ApiOperation({ summary: 'List roadmaps (admin)' })
  list(@Query() q: RoadmapListQueryDto) {
    return this.service.list(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail of one roadmap' })
  get(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create roadmap' })
  create(@Body() dto: CreateRoadmapDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update roadmap metadata / milestones / isActive' })
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateRoadmapDto,
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publish: bump version + flip previous active version off',
  })
  publish(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.publish(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a roadmap (hard delete)' })
  async remove(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ): Promise<void> {
    await this.service.remove(id);
  }

  // ===== Milestone editing =====

  @Post(':id/milestones')
  @ApiOperation({ summary: 'Add a milestone (chapter) to a roadmap' })
  addMilestone(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: MilestoneDto,
  ) {
    return this.service.addMilestone(id, dto);
  }

  @Delete(':id/milestones/:order')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a milestone (does not delete its nodes)' })
  async removeMilestone(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Param('order') order: string,
  ): Promise<void> {
    await this.service.removeMilestone(id, Number(order));
  }

  // ===== Nodes inside a roadmap =====

  @Get(':id/nodes')
  @ApiOperation({ summary: 'List nodes in a roadmap' })
  listNodes(
    @Param('id', ParseObjectIdPipe) roadmapId: Types.ObjectId,
    @Query() q: NodeListQueryDto,
  ) {
    return this.service.listNodes(roadmapId, q);
  }

  @Post(':id/nodes')
  @ApiOperation({ summary: 'Create a new node inside a roadmap' })
  createNode(
    @Param('id', ParseObjectIdPipe) roadmapId: Types.ObjectId,
    @Body() dto: CreateNodeDto,
  ) {
    return this.service.createNode(roadmapId, dto);
  }
}

@ApiTags('Admin · Roadmap Nodes')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/nodes')
export class AdminNodesController {
  constructor(private readonly service: AdminRoadmapsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a single node' })
  get(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.getNode(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a node' })
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateNodeDto,
  ) {
    return this.service.updateNode(id, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish / unpublish a node' })
  publish(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: PublishNodeDto,
  ) {
    return this.service.publishNode(id, dto.isPublished);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a node (also detaches from milestone)' })
  async remove(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ): Promise<void> {
    await this.service.removeNode(id);
  }
}
