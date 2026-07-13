import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  AiChatSession,
  AiChatSessionDocument,
} from './schemas/ai-chat-session.schema';
import {
  AiChatMessage,
  AiChatMessageDocument,
} from './schemas/ai-chat-message.schema';
import { AIMessageRole } from '../common/enums';

import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GetSessionsDto } from './dto/get-sessions.dto';
import { AI_MENTOR_PROVIDER } from './interfaces/ai-mentor.constants';
import { IAiMentorProvider } from './interfaces/ai-mentor-provider.interface';
import { PromptStrategyService } from './strategies/prompt-strategy.service';

@Injectable()
export class AiMentorService {
  private static readonly HISTORY_WINDOW = 10;
  constructor(
    @InjectModel(AiChatSession.name)
    private readonly sessionModel: Model<AiChatSessionDocument>,

    @InjectModel(AiChatMessage.name)
    private readonly messageModel: Model<AiChatMessageDocument>,

    @Inject(AI_MENTOR_PROVIDER)
    private readonly aiProvider: IAiMentorProvider,

    private readonly promptStrategy: PromptStrategyService,
  ) {}

  // ─── Session Management ─────────────────────────────

  async createSession(userId: string, dto: CreateSessionDto) {
    const session = await this.sessionModel.create({
      userId: new Types.ObjectId(userId),
      nodeId: dto.nodeId ? new Types.ObjectId(dto.nodeId) : undefined,
      questionId: dto.questionId
        ? new Types.ObjectId(dto.questionId)
        : undefined,
      exerciseId: dto.exerciseId
        ? new Types.ObjectId(dto.exerciseId)
        : undefined,
      battleId: dto.battleId ? new Types.ObjectId(dto.battleId) : undefined,
      style: dto.style,
      tone: dto.tone,
      contextSummary: dto.contextSummary,
    });

    // Nếu có contextSummary → lưu làm message SYSTEM đầu tiên
    if (dto.contextSummary) {
      await this.messageModel.create({
        sessionId: session._id,
        role: AIMessageRole.SYSTEM,
        content: dto.contextSummary,
        tokenUsed: 0,
      });
    }

    return session;
  }

  async getSessions(userId: string, dto: GetSessionsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;

    const filter = { userId: new Types.ObjectId(userId) };

    const [sessions, total] = await Promise.all([
      this.sessionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.sessionModel.countDocuments(filter),
    ]);

    return { sessions, total, page, limit };
  }

  async getSessionDetail(sessionId: string, userId: string) {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new NotFoundException('Session not found');
    }

    const session = await this.sessionModel.findById(sessionId).lean();
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Ownership check
    if (String(session.userId) !== userId) {
      throw new ForbiddenException('You do not own this session');
    }

    // Load messages theo thứ tự thời gian
    const messages = await this.messageModel
      .find({ sessionId: new Types.ObjectId(sessionId) })
      .sort({ createdAt: 1 })
      .lean();

    return { ...session, messages };
  }

  async closeSession(sessionId: string, userId: string) {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new NotFoundException('Session not found');
    }

    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (String(session.userId) !== userId) {
      throw new ForbiddenException('You do not own this session');
    }

    if (session.isClosed) {
      throw new BadRequestException('Session is already closed');
    }

    session.isClosed = true;
    await session.save();

    return { message: 'Session closed successfully' };
  }

  // ─── Helpers (dùng ở Step 6) ─────────────────────────

  /**
   * Validate session tồn tại, thuộc user, chưa đóng.
   * Dùng chung cho sendMessage và các operations khác.
   */
  async validateActiveSession(sessionId: string, userId: string) {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new NotFoundException('Session not found');
    }

    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (String(session.userId) !== userId) {
      throw new ForbiddenException('You do not own this session');
    }

    if (session.isClosed) {
      throw new BadRequestException('Session is closed. Create a new one.');
    }

    return session;
  }

  /** Step 6 sẽ implement */
  async sendMessage(sessionId: string, userId: string, dto: SendMessageDto) {
    // 1. Validate session
    const session = await this.validateActiveSession(sessionId, userId);

    // 2. Lưu user message trước
    const userMessage = await this.messageModel.create({
      sessionId: session._id,
      role: AIMessageRole.USER,
      content: dto.content,
      tokenUsed: 0,
    });

    // 3. Load history (10 tin gần nhất, BỎ QUA system message)
    const recentMessages = await this.messageModel
      .find({
        sessionId: session._id,
        role: { $ne: AIMessageRole.SYSTEM },
      })
      .sort({ createdAt: -1 })
      .limit(AiMentorService.HISTORY_WINDOW)
      .lean();

    // Đảo ngược lại cho đúng thứ tự thời gian (query sort DESC để lấy 10 mới nhất)
    recentMessages.reverse();

    // 4. Build system prompt
    const systemPrompt = this.promptStrategy.buildSystemPrompt({
      style: session.style,
      tone: session.tone,
      contextSummary: session.contextSummary,
    });

    // 5. Ghép messages array cho AI
    const aiMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // 6. Gọi AI
    const aiResponse = await this.aiProvider.chat(aiMessages);

    // 7. Lưu AI response
    const assistantMessage = await this.messageModel.create({
      sessionId: session._id,
      role: AIMessageRole.ASSISTANT,
      content: aiResponse.content,
      tokenUsed: aiResponse.tokenUsed,
    });

    // 8. Update session stats
    await this.sessionModel.findByIdAndUpdate(session._id, {
      $inc: {
        messageCount: 2, // user + assistant
        totalTokensUsed: aiResponse.tokenUsed,
      },
    });

    // 9. Trả về cho FE
    return {
      userMessage: {
        _id: userMessage._id,
        role: userMessage.role,
        content: userMessage.content,
        createdAt: userMessage.createdAt,
      },
      assistantMessage: {
        _id: assistantMessage._id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        tokenUsed: assistantMessage.tokenUsed,
        createdAt: assistantMessage.createdAt,
      },
    };
  }
}
