import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CareerField, DisciplineLevel, SkillLevel } from '../../common/enums';
import { LearningPathService } from '../../learning-path/learning-path.service';
import { UsersService } from '../../users/service/users.service';
import {
  CareerPathDto,
  DisciplineDto,
  SkillTestRunDto,
  SkillTestStartDto,
  SkillTestSubmitDto,
} from '../dto/survey.dto';
import {
  SurveyResponse,
  SurveyResponseDocument,
} from '../schemas/survey-response.schema';
import { SkillTestService } from './skill-test.service';

@Injectable()
export class SurveyService {
  constructor(
    @InjectModel(SurveyResponse.name)
    private readonly surveyModel: Model<SurveyResponseDocument>,
    private readonly users: UsersService,
    private readonly skillTest: SkillTestService,
    private readonly learningPath: LearningPathService,
  ) {}

  private async getOrCreateDraft(
    userId: Types.ObjectId,
  ): Promise<SurveyResponseDocument> {
    const draft = await this.surveyModel
      .findOne({ userId, isCompleted: false })
      .sort({ createdAt: -1 });
    if (draft) return draft;
    return this.surveyModel.create({
      userId,
      fieldFocus: CareerField.FULLSTACK,
      isCompleted: false,
    });
  }

  // ---- segments ----

  async saveCareerPath(
    userId: Types.ObjectId,
    dto: CareerPathDto,
  ): Promise<SurveyResponseDocument> {
    const draft = await this.getOrCreateDraft(userId);
    draft.fieldFocus = dto.fieldFocus;
    if (dto.learningGoal !== undefined) draft.learningGoal = dto.learningGoal;
    return draft.save();
  }

  async startSkillTest(userId: Types.ObjectId, dto: SkillTestStartDto) {
    const selectedLevel = dto.selfAssessedLevel ?? SkillLevel.APPRENTICE;
    const problems = await this.skillTest.pickCodingProblems(
      dto.fieldFocus,
      selectedLevel,
      dto.questionCount ?? 5,
    );
    if (problems.length === 0) {
      throw new BadRequestException(
        'No coding problems configured for this field yet',
      );
    }
    // Persist the assigned question ids onto the draft so submit can be
    // validated and re-graded safely.
    const draft = await this.getOrCreateDraft(userId);
    draft.fieldFocus = dto.fieldFocus;
    draft.selfAssessedLevel = selectedLevel;
    if (dto.knownLanguages) draft.knownLanguages = dto.knownLanguages;
    draft.technicalTestAnswers = problems.map((p) => ({
      questionId: p._id,
      passedTestCases: 0,
      totalTestCases: p.totalTestCases,
      isCorrect: false,
    }));
    await draft.save();
    const poolSnapshot = this.skillTest.getProblemPoolSnapshot(
      dto.fieldFocus,
      selectedLevel,
    );
    return {
      problems,
      totalProblems: problems.length,
      requestedLevel: selectedLevel,
      requestedQuestionCount: dto.questionCount ?? 5,
      deliveredQuestionCount: problems.length,
      poolSize: poolSnapshot.poolSize,
      poolBreakdown: poolSnapshot.poolBreakdown,
      fallbackUsed: problems.some(
        (problem) => problem.targetSkillLevel !== selectedLevel,
      ),
    };
  }

  async runSkillTest(userId: Types.ObjectId, dto: SkillTestRunDto) {
    const draft = await this.getOrCreateDraft(userId);
    const assignedSet = new Set(
      draft.technicalTestAnswers.map((answer) => answer.questionId.toString()),
    );

    if (!assignedSet.has(dto.questionId)) {
      throw new BadRequestException(
        `Question ${dto.questionId} is not part of this skill test`,
      );
    }

    return this.skillTest.runSolution(dto.questionId, dto.code);
  }

  async submitSkillTest(
    userId: Types.ObjectId,
    dto: SkillTestSubmitDto,
  ): Promise<SurveyResponseDocument> {
    const draft = await this.getOrCreateDraft(userId);
    const assignedIds = draft.technicalTestAnswers.map((a) => a.questionId);
    if (assignedIds.length === 0) {
      throw new BadRequestException('Skill test has not been started');
    }
    const assignedSet = new Set(assignedIds.map((id) => id.toString()));
    for (const solution of dto.solutions) {
      if (!assignedSet.has(solution.questionId)) {
        throw new BadRequestException(
          `Question ${solution.questionId} is not part of this skill test`,
        );
      }
    }

    const result = await this.skillTest.grade(
      assignedIds,
      dto.solutions,
      draft.selfAssessedLevel,
    );
    draft.technicalTestAnswers = result.perQuestion;
    draft.technicalTestScore = result.scorePercent;
    draft.technicalTestTimeSeconds = dto.totalTimeSeconds;
    draft.computedEntryLevel = result.computedEntryLevel;
    return draft.save();
  }

  async saveDiscipline(
    userId: Types.ObjectId,
    dto: DisciplineDto,
  ): Promise<SurveyResponseDocument> {
    const draft = await this.getOrCreateDraft(userId);
    draft.dailyHours = dto.dailyHours;
    draft.focusTimeWindow = dto.focusTimeWindow;
    draft.milestoneTestPreference = dto.milestoneTestPreference;
    draft.disciplineLevel = dto.disciplineLevel;
    return draft.save();
  }

  async complete(userId: Types.ObjectId): Promise<SurveyResponseDocument> {
    const draft = await this.getOrCreateDraft(userId);
    if (!draft.fieldFocus) {
      throw new BadRequestException('Career path not set');
    }
    if (!draft.computedEntryLevel) {
      throw new BadRequestException('Skill test not completed');
    }
    if (!draft.dailyHours) {
      throw new BadRequestException('Discipline setup not completed');
    }

    draft.isCompleted = true;
    draft.completedAt = new Date();
    const latest = await this.surveyModel
      .findOne({ userId, isCompleted: true })
      .sort({ version: -1 });
    draft.version = (latest?.version ?? 0) + 1;
    await draft.save();

    await this.users.updatePreferences(userId, {
      dailyStudyHours: draft.dailyHours,
      focusTimeWindow: draft.focusTimeWindow,
      disciplineLevel: draft.disciplineLevel,
      milestoneTestPreference: draft.milestoneTestPreference as
        | 'battle'
        | 'project',
    });
    const user = await this.users.findById(userId);
    user.fieldFocus = draft.fieldFocus;
    user.selfAssessedLevel = draft.selfAssessedLevel;
    user.learningGoal = draft.learningGoal;
    user.knownLanguages = draft.knownLanguages ?? [];
    await user.save();
    await this.learningPath.syncSurveyPlacement(
      userId,
      draft.computedEntryLevel,
      draft.fieldFocus,
    );
    await this.users.completeFirstLogin(userId);

    return draft;
  }

  async getLatest(
    userId: Types.ObjectId,
  ): Promise<SurveyResponseDocument | null> {
    return this.surveyModel.findOne({ userId }).sort({ createdAt: -1 });
  }

  async retake(userId: Types.ObjectId): Promise<SurveyResponseDocument> {
    return this.surveyModel.create({
      userId,
      fieldFocus: CareerField.FULLSTACK,
      disciplineLevel: DisciplineLevel.LIGHT,
      isCompleted: false,
    });
  }
}
