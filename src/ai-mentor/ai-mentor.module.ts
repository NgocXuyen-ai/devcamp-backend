import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  AiChatSession,
  AiChatSessionSchema,
} from './schemas/ai-chat-session.schema';
import {
  AiChatMessage,
  AiChatMessageSchema,
} from './schemas/ai-chat-message.schema';

import { AiMentorService } from './ai-mentor.service';
import { AI_MENTOR_PROVIDER } from './interfaces/ai-mentor.constants';
import { GroqMentorProvider } from './providers/groq-mentor.provider';
import { PromptStrategyService } from './strategies/prompt-strategy.service';
import { AiMentorController } from './ai-mentor.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiChatSession.name, schema: AiChatSessionSchema },
      { name: AiChatMessage.name, schema: AiChatMessageSchema },
    ]),
  ],
  controllers: [AiMentorController],
  providers: [
    AiMentorService,
    PromptStrategyService,
    {
      provide: AI_MENTOR_PROVIDER,
      useClass: GroqMentorProvider,
    },
  ],
  exports: [AiMentorService],
})
export class AIMentorModule {}
