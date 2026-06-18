import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NodeStatus, PenaltyType, QuestionType } from '../common/enums';
import { Question } from '../exercises/schemas/question.schema';
import { RoadmapNode } from '../learning-path/schemas/roadmap-node.schema';
import { UserProgress } from '../learning-path/schemas/user-progress.schema';
import { Penalty } from '../penalties/schemas/penalty.schema';
import { AnswerRecallTestDto } from './dto/answer-recall-test.dto';
import { CreateRecallTestDto } from './dto/create-recall-test.dto';
import { ReviewRecallDto } from './dto/review-recall.dto';
import { Recall } from './schemas/recall.schema';
import { RecallTest } from './schemas/recall-test.schema';

@Injectable()
export class RecallService {
  constructor(
    @InjectModel(Recall.name)
    private readonly recallModel: Model<Recall>,
    @InjectModel(RecallTest.name)
    private readonly recallTestModel: Model<RecallTest>,
    @InjectModel(Question.name)
    private readonly questionModel: Model<Question>,
    @InjectModel(RoadmapNode.name)
    private readonly nodeModel: Model<RoadmapNode>,
    @InjectModel(UserProgress.name)
    private readonly progressModel: Model<UserProgress>,
    @InjectModel(Penalty.name)
    private readonly penaltyModel: Model<Penalty>,
  ) {}

  getDueRecallItems(userId: Types.ObjectId) {
    return this.recallModel
      .find({
        userId,
        nextReviewDate: { $lte: new Date() },
      })
      .populate('questionId')
      .populate('nodeId')
      .sort({ nextReviewDate: 1 });
  }

  async scheduleNodeRecall(userId: Types.ObjectId, nodeId: Types.ObjectId) {
    const node = await this.nodeModel.findById(nodeId);
    if (!node) {
      throw new NotFoundException('Node not found');
    }

    const questionIds = node.content?.questionIds ?? [];
    if (questionIds.length === 0) {
      return { scheduledCount: 0 };
    }

    const nextReviewDate = this.addDays(new Date(), 1);
    const result = await this.recallModel.bulkWrite(
      questionIds.map((questionId) => ({
        updateOne: {
          filter: { userId, questionId },
          update: {
            $setOnInsert: {
              userId,
              questionId,
              nodeId,
              interval: 1,
              easeFactor: 2.5,
              repetitions: 0,
              nextReviewDate,
              lastQuality: 0,
              mode: 'auto',
            },
          },
          upsert: true,
        },
      })),
    );

    return { scheduledCount: result.upsertedCount };
  }

  async reviewRecallItem(
    userId: Types.ObjectId,
    recallId: string,
    dto: ReviewRecallDto,
  ) {
    const recall = await this.recallModel.findOne({
      _id: recallId,
      userId,
    });

    if (!recall) {
      throw new NotFoundException('Recall item not found');
    }

    const nextSchedule = this.calculateSm2Schedule(
      recall.interval,
      recall.easeFactor,
      recall.repetitions,
      dto.quality,
    );

    recall.interval = nextSchedule.interval;
    recall.easeFactor = nextSchedule.easeFactor;
    recall.repetitions = nextSchedule.repetitions;
    recall.nextReviewDate = this.addDays(new Date(), nextSchedule.interval);
    recall.lastReviewedAt = new Date();
    recall.lastQuality = dto.quality;

    return recall.save();
  }

  async createRecallTest(userId: Types.ObjectId, dto: CreateRecallTestDto) {
    const lockedNodeId = new Types.ObjectId(dto.lockedNodeId);
    const node = await this.nodeModel.findById(lockedNodeId);

    if (!node) {
      throw new NotFoundException('Locked node not found');
    }

    const nodeQuestionIds = node.content?.questionIds ?? [];
    if (nodeQuestionIds.length === 0) {
      throw new BadRequestException(
        'This node has no questions for recall test',
      );
    }

    const questions = await this.questionModel.find({
      _id: { $in: nodeQuestionIds },
      type: QuestionType.MULTIPLE_CHOICE,
      isPublished: true,
    });

    if (questions.length === 0) {
      throw new BadRequestException('No multiple-choice questions found');
    }

    const selectedQuestions = this.shuffle(questions).slice(0, 10);
    const selectedQuestionIds = selectedQuestions.map(
      (question) => question._id,
    );

    const recallTest = await this.recallTestModel.create({
      userId,
      lockedNodeId,
      questionIds: selectedQuestionIds,
      totalCount: selectedQuestionIds.length,
      passingScore: Math.min(3, selectedQuestionIds.length),
      startedAt: new Date(),
    });

    await this.penaltyModel.findOneAndUpdate(
      { userId, nodeId: lockedNodeId },
      { activeRecallTestId: recallTest._id },
    );

    return {
      test: recallTest,
      questions: selectedQuestions.map((question) => ({
        _id: question._id,
        title: question.title,
        content: question.content,
        type: question.type,
        difficulty: question.difficulty,
        options: question.options.map((option, index) => ({
          index,
          text: option.text,
        })),
        timeLimitSeconds: question.timeLimitSeconds,
      })),
    };
  }

  async answerRecallTest(
    userId: Types.ObjectId,
    testId: string,
    dto: AnswerRecallTestDto,
  ) {
    const recallTest = await this.recallTestModel.findOne({
      _id: testId,
      userId,
      isCompleted: false,
    });

    if (!recallTest) {
      throw new NotFoundException('Active recall test not found');
    }

    const questionId = new Types.ObjectId(dto.questionId);
    const isQuestionInTest = recallTest.questionIds.some((id) =>
      id.equals(questionId),
    );

    if (!isQuestionInTest) {
      throw new BadRequestException('Question does not belong to this test');
    }

    const question = await this.questionModel.findById(questionId);
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const isCorrect = this.isCorrectMultipleChoiceAnswer(question, dto.answer);
    const existingAnswerIndex = recallTest.answers.findIndex((answer) =>
      answer.questionId.equals(questionId),
    );
    const answerPayload = {
      questionId,
      userAnswer: dto.answer,
      isCorrect,
      timeSpentSeconds: dto.timeSpentSeconds,
    };

    if (existingAnswerIndex >= 0) {
      recallTest.answers[existingAnswerIndex] = answerPayload;
    } else {
      recallTest.answers.push(answerPayload);
    }

    recallTest.correctCount = recallTest.answers.filter(
      (answer) => answer.isCorrect,
    ).length;

    return recallTest.save();
  }

  async submitRecallTest(userId: Types.ObjectId, testId: string) {
    const recallTest = await this.recallTestModel.findOne({
      _id: testId,
      userId,
    });

    if (!recallTest) {
      throw new NotFoundException('Recall test not found');
    }

    if (recallTest.isCompleted) {
      return recallTest;
    }

    recallTest.correctCount = recallTest.answers.filter(
      (answer) => answer.isCorrect,
    ).length;
    recallTest.isPassed = recallTest.correctCount >= recallTest.passingScore;
    recallTest.isCompleted = true;
    recallTest.completedAt = new Date();

    if (recallTest.isPassed) {
      await this.unlockNodeAfterPassedRecall(userId, recallTest.lockedNodeId);
    } else {
      recallTest.extraLockMinutes = 5;
      await this.extendNodeLock(userId, recallTest.lockedNodeId, 5);
    }

    return recallTest.save();
  }

  private calculateSm2Schedule(
    currentInterval: number,
    currentEaseFactor: number,
    currentRepetitions: number,
    quality: number,
  ) {
    let repetitions = currentRepetitions;
    let interval = currentInterval;
    const qualityGap = 5 - quality;
    const easeFactor = Math.max(
      1.3,
      currentEaseFactor + (0.1 - qualityGap * (0.08 + qualityGap * 0.02)),
    );

    if (quality < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      repetitions += 1;
      if (repetitions === 1) interval = 1;
      else if (repetitions === 2) interval = 6;
      else interval = Math.round(interval * easeFactor);
    }

    return { interval, easeFactor, repetitions };
  }

  private async unlockNodeAfterPassedRecall(
    userId: Types.ObjectId,
    nodeId: Types.ObjectId,
  ) {
    await this.progressModel.findOneAndUpdate(
      { userId, nodeId },
      {
        status: NodeStatus.OPEN,
        submitCount: 0,
        wrongCount: 0,
        $unset: { lockedUntil: 1 },
      },
    );

    await this.penaltyModel.findOneAndUpdate(
      { userId, nodeId },
      {
        quotaRemaining: 10,
        isLocked: false,
        consecutiveFailures: 0,
        $inc: { recallResetCount: 1 },
        $unset: { lockUntil: 1, activeRecallTestId: 1 },
      },
    );
  }

  private async extendNodeLock(
    userId: Types.ObjectId,
    nodeId: Types.ObjectId,
    minutes: number,
  ) {
    const lockUntil = new Date(Date.now() + minutes * 60 * 1000);

    await this.progressModel.findOneAndUpdate(
      { userId, nodeId },
      {
        status: NodeStatus.TEMP_LOCKED,
        lockedUntil: lockUntil,
      },
      { upsert: false },
    );

    await this.penaltyModel.findOneAndUpdate(
      { userId, nodeId },
      {
        type: PenaltyType.LOCKED,
        isLocked: true,
        lockUntil,
        $unset: { activeRecallTestId: 1 },
      },
      { upsert: true },
    );
  }

  private isCorrectMultipleChoiceAnswer(question: Question, answer: string) {
    const normalizedAnswer = answer.trim().toLowerCase();

    return question.options.some((option, index) => {
      if (!option.isCorrect) return false;

      return (
        option.text.trim().toLowerCase() === normalizedAnswer ||
        String(index) === normalizedAnswer ||
        String(index + 1) === normalizedAnswer
      );
    });
  }

  private addDays(date: Date, days: number) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  private shuffle<T>(items: T[]) {
    return [...items].sort(() => Math.random() - 0.5);
  }
}
