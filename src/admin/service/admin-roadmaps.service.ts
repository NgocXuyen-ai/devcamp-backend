import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { RoadmapNodeService } from '../../learning-path/services/roadmap-node.service';
import { RoadmapService } from '../../learning-path/services/roadmap.service';
import {
  CreateNodeDto,
  CreateRoadmapDto,
  MilestoneDto,
  NodeListQueryDto,
  RoadmapListQueryDto,
  UpdateNodeDto,
  UpdateRoadmapDto,
} from '../dto/admin-roadmap.dto';

@Injectable()
export class AdminRoadmapsService {
  constructor(
    private readonly roadmaps: RoadmapService,
    private readonly nodes: RoadmapNodeService,
  ) {}

  // ----- Roadmap CRUD -----

  list(q: RoadmapListQueryDto) {
    return this.roadmaps.list({
      field: q.field,
      level: q.level,
      isActive: q.isActive,
      page: q.page,
      limit: q.limit,
      skip: q.skip,
    });
  }

  get(id: Types.ObjectId) {
    return this.roadmaps.findById(id);
  }

  create(dto: CreateRoadmapDto) {
    return this.roadmaps.create({
      ...dto,
      milestones: dto.milestones?.map((m) => this.normaliseMilestone(m)) ?? [],
    });
  }

  update(id: Types.ObjectId, dto: UpdateRoadmapDto) {
    return this.roadmaps.update(id, {
      ...dto,
      milestones: dto.milestones?.map((m) => this.normaliseMilestone(m)),
    });
  }

  publish(id: Types.ObjectId) {
    return this.roadmaps.publishNewVersion(id);
  }

  setActive(id: Types.ObjectId, isActive: boolean) {
    return this.roadmaps.setActive(id, isActive);
  }

  remove(id: Types.ObjectId) {
    return this.roadmaps.remove(id);
  }

  // ----- Milestone editing -----

  addMilestone(id: Types.ObjectId, dto: MilestoneDto) {
    return this.roadmaps.addMilestone(id, this.normaliseMilestone(dto));
  }

  removeMilestone(id: Types.ObjectId, order: number) {
    return this.roadmaps.removeMilestone(id, order);
  }

  // ----- Node CRUD -----

  listNodes(roadmapId: Types.ObjectId, q: NodeListQueryDto) {
    return this.nodes.list({
      roadmapId: roadmapId.toString(),
      milestoneOrder: q.milestoneOrder,
      type: q.type,
      isPublished: q.isPublished,
      page: q.page,
      limit: q.limit,
      skip: q.skip,
    });
  }

  getNode(id: Types.ObjectId) {
    return this.nodes.findById(id);
  }

  createNode(roadmapId: Types.ObjectId, dto: CreateNodeDto) {
    return this.nodes.create({
      ...dto,
      roadmapId,
      content: dto.content
        ? {
            theory: dto.content.theory,
            videoUrl: dto.content.videoUrl,
            attachments: dto.content.attachments ?? [],
            questionIds:
              dto.content.questionIds?.map((id) => new Types.ObjectId(id)) ??
              [],
            labExerciseId: dto.content.labExerciseId
              ? new Types.ObjectId(dto.content.labExerciseId)
              : undefined,
          }
        : undefined,
      unlockCondition: dto.unlockCondition
        ? {
            prerequisiteNodeIds:
              dto.unlockCondition.prerequisiteNodeIds?.map(
                (id) => new Types.ObjectId(id),
              ) ?? [],
            minScore: dto.unlockCondition.minScore ?? 0,
            requiresBattleWin: dto.unlockCondition.requiresBattleWin ?? false,
          }
        : undefined,
    });
  }

  updateNode(id: Types.ObjectId, dto: UpdateNodeDto) {
    return this.nodes.update(id, {
      ...dto,
      content: dto.content
        ? {
            theory: dto.content.theory,
            videoUrl: dto.content.videoUrl,
            attachments: dto.content.attachments ?? [],
            questionIds:
              dto.content.questionIds?.map((id) => new Types.ObjectId(id)) ??
              [],
            labExerciseId: dto.content.labExerciseId
              ? new Types.ObjectId(dto.content.labExerciseId)
              : undefined,
          }
        : undefined,
      unlockCondition: dto.unlockCondition
        ? {
            prerequisiteNodeIds:
              dto.unlockCondition.prerequisiteNodeIds?.map(
                (id) => new Types.ObjectId(id),
              ) ?? [],
            minScore: dto.unlockCondition.minScore ?? 0,
            requiresBattleWin: dto.unlockCondition.requiresBattleWin ?? false,
          }
        : undefined,
    });
  }

  publishNode(id: Types.ObjectId, isPublished: boolean) {
    return this.nodes.publish(id, isPublished);
  }

  removeNode(id: Types.ObjectId) {
    return this.nodes.remove(id);
  }

  // ----- helpers -----

  private normaliseMilestone(m: MilestoneDto) {
    return {
      title: m.title,
      description: m.description,
      order: m.order,
      nodeIds: (m.nodeIds ?? []).map((id) => new Types.ObjectId(id)),
      gateType: m.gateType ?? 'project',
      rewardXp: m.rewardXp ?? 0,
      rewardCoins: m.rewardCoins ?? 0,
    };
  }
}
