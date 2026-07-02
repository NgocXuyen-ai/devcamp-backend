import { Types } from 'mongoose';
import { CareerField, SkillLevel } from '../../common/enums';
import { SurveyService } from './survey.service';

describe('SurveyService', () => {
  const save = jest.fn();
  const sort = jest.fn();
  const findOne = jest.fn(() => ({ sort }));
  const create = jest.fn();

  const surveyModel = {
    findOne,
    create,
  };

  const users = {
    updatePreferences: jest.fn(),
    findById: jest.fn(),
    completeFirstLogin: jest.fn(),
  };

  const skillTest = {
    pickCodingProblems: jest.fn(),
    getProblemPoolSnapshot: jest.fn(),
    grade: jest.fn(),
    runSolution: jest.fn(),
  };

  const learningPath = {
    syncSurveyPlacement: jest.fn(),
  };

  let service: SurveyService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SurveyService(
      surveyModel as never,
      users as never,
      skillTest as never,
      learningPath as never,
    );
  });

  it('starts a skill test with 5 random problems and returns pool metadata', async () => {
    const draft = {
      fieldFocus: CareerField.FRONTEND,
      selfAssessedLevel: undefined,
      knownLanguages: [],
      technicalTestAnswers: [],
      save,
    };
    sort.mockResolvedValue(draft);

    const problems = Array.from({ length: 5 }, (_, index) => ({
      _id: new Types.ObjectId(),
      title: `Problem ${index + 1}`,
      content: 'Test content',
      difficulty: 'easy',
      track: CareerField.FRONTEND,
      targetSkillLevel: SkillLevel.NOVICE,
      language: 'javascript' as const,
      starterCode: 'function solve() {}',
      timeLimitSeconds: 240,
      estimatedMinutes: 4,
      sampleTestCases: [],
      totalTestCases: 2,
    }));

    skillTest.pickCodingProblems.mockResolvedValue(problems);
    skillTest.getProblemPoolSnapshot.mockReturnValue({
      poolSize: 10,
      poolBreakdown: {
        [CareerField.FRONTEND]: 10,
      },
    });

    const result = await service.startSkillTest(new Types.ObjectId(), {
      fieldFocus: CareerField.FRONTEND,
      selfAssessedLevel: SkillLevel.NOVICE,
      questionCount: 5,
      knownLanguages: ['javascript'],
    });

    expect(skillTest.pickCodingProblems).toHaveBeenCalledWith(
      CareerField.FRONTEND,
      SkillLevel.NOVICE,
      5,
    );
    expect(skillTest.getProblemPoolSnapshot).toHaveBeenCalledWith(
      CareerField.FRONTEND,
      SkillLevel.NOVICE,
    );
    expect(draft.technicalTestAnswers).toHaveLength(5);
    expect(draft.selfAssessedLevel).toBe(SkillLevel.NOVICE);
    expect(save).toHaveBeenCalled();
    expect(result).toMatchObject({
      totalProblems: 5,
      requestedLevel: SkillLevel.NOVICE,
      requestedQuestionCount: 5,
      deliveredQuestionCount: 5,
      poolSize: 10,
      poolBreakdown: {
        [CareerField.FRONTEND]: 10,
      },
      fallbackUsed: false,
    });
  });

  it('passes the draft self-assessed level to grading', async () => {
    const draft = {
      technicalTestAnswers: [
        {
          questionId: new Types.ObjectId(),
          passedTestCases: 0,
          totalTestCases: 2,
          isCorrect: false,
        },
      ],
      selfAssessedLevel: SkillLevel.JOURNEYMAN,
      save,
    };
    sort.mockResolvedValue(draft);
    skillTest.grade.mockResolvedValue({
      passedTestCases: 2,
      totalTestCases: 4,
      scorePercent: 50,
      computedEntryLevel: 'root',
      perQuestion: draft.technicalTestAnswers,
    });

    await service.submitSkillTest(new Types.ObjectId(), {
      solutions: [
        {
          questionId: draft.technicalTestAnswers[0].questionId.toString(),
          code: 'function solve() { return 1; }',
        },
      ],
      totalTimeSeconds: 120,
    });

    expect(skillTest.grade).toHaveBeenCalledWith(
      [draft.technicalTestAnswers[0].questionId],
      [
        {
          questionId: draft.technicalTestAnswers[0].questionId.toString(),
          code: 'function solve() { return 1; }',
        },
      ],
      SkillLevel.JOURNEYMAN,
    );
  });
});
