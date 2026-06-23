import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { AIMentorStyle, AIMentorTone } from '../../common/enums';
import { AiMentorConfigDto } from '../dto/admin-config.dto';
import { AdminConfigService } from './admin-configs.service';

export interface AiMentorConfig {
  defaultStyle: AIMentorStyle;
  defaultTone: AIMentorTone;
  model: string;
  maxTokensPerMessage: number;
  maxMessagesPerSession: number;
  hintLineLimit: number;
  allowCodeInOutput: boolean;
  maxHintLevelsPerQuestion: number;
}

/** Defaults derived from Milestone 2 survey + doc constraints. */
const DEFAULTS: AiMentorConfig = {
  defaultStyle: AIMentorStyle.INDIRECT, // 52.9% user vote
  defaultTone: AIMentorTone.FRIENDLY,
  model: 'gpt-4',
  maxTokensPerMessage: 300,
  maxMessagesPerSession: 50,
  hintLineLimit: 2, // doc: "gợi ý trong 1-2 dòng"
  allowCodeInOutput: false, // doc: "không cung cấp code trực tiếp"
  maxHintLevelsPerQuestion: 5,
};

const SCOPE = 'ai_mentor';
const KEY = 'default';

@Injectable()
export class AdminAiMentorService {
  constructor(private readonly configs: AdminConfigService) {}

  async get(): Promise<AiMentorConfig> {
    return this.configs.getValue<AiMentorConfig>(SCOPE, KEY, DEFAULTS);
  }

  async update(
    patch: AiMentorConfigDto,
    updatedBy: Types.ObjectId,
  ): Promise<AiMentorConfig> {
    const current = await this.get();
    const next: AiMentorConfig = { ...current, ...patch };
    await this.configs.upsert(SCOPE, KEY, {
      value: next,
      description: 'AI Mentor default style/tone/model and output limits',
      updatedBy,
    });
    return next;
  }

  /** Reset to baseline defaults — used by the "Reset to defaults" UI button. */
  async reset(updatedBy: Types.ObjectId): Promise<AiMentorConfig> {
    await this.configs.upsert(SCOPE, KEY, {
      value: DEFAULTS,
      description: 'AI Mentor defaults (reset)',
      updatedBy,
    });
    return DEFAULTS;
  }
}
