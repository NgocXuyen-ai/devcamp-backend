import { Types } from 'mongoose';
import { CareerField, SkillLevel } from '../../common/enums';
import { SkillTestService } from './skill-test.service';

describe('SkillTestService', () => {
  let service: SkillTestService;

  beforeEach(() => {
    service = new SkillTestService(
      {
        findById: jest.fn(),
      } as never,
      {
        evaluate: jest.fn(),
      } as never,
    );
  });

  it('returns 5 unique problems from the requested level pool', async () => {
    const problems = await service.pickCodingProblems(
      CareerField.FRONTEND,
      SkillLevel.NOVICE,
    );

    expect(problems).toHaveLength(5);
    expect(
      new Set(problems.map((problem) => problem._id.toString())).size,
    ).toBe(5);
    expect(
      problems.every(
        (problem) =>
          problem.track === CareerField.FRONTEND &&
          problem.targetSkillLevel === SkillLevel.NOVICE,
      ),
    ).toBe(true);
  });

  it('mixes frontend and backend problems for fullstack selections', async () => {
    const problems = await service.pickCodingProblems(
      CareerField.FULLSTACK,
      SkillLevel.APPRENTICE,
      5,
    );

    expect(problems).toHaveLength(5);
    expect(
      problems.every(
        (problem) => problem.targetSkillLevel === SkillLevel.APPRENTICE,
      ),
    ).toBe(true);
    expect(new Set(problems.map((problem) => problem.track))).toEqual(
      new Set([CareerField.FRONTEND, CareerField.BACKEND]),
    );
  });

  it('reports the level pool breakdown for the selected field', () => {
    expect(
      service.getProblemPoolSnapshot(CareerField.BACKEND, SkillLevel.MASTER),
    ).toEqual({
      poolSize: 10,
      poolBreakdown: {
        [CareerField.BACKEND]: 10,
      },
    });

    expect(
      service.getProblemPoolSnapshot(CareerField.FULLSTACK, SkillLevel.MASTER),
    ).toEqual({
      poolSize: 20,
      poolBreakdown: {
        [CareerField.FRONTEND]: 10,
        [CareerField.BACKEND]: 10,
      },
    });
  });

  it('caps requested count at 5 even when a larger number is passed', async () => {
    const problems = await service.pickCodingProblems(
      CareerField.FRONTEND,
      SkillLevel.JOURNEYMAN,
      99,
    );

    expect(problems).toHaveLength(5);
    problems.forEach((problem) => {
      expect(Types.ObjectId.isValid(problem._id)).toBe(true);
    });
  });

  it('keeps 50% intermediate attempts at beginner and promotes above 50%', () => {
    expect(service.computeEntryLevel(50, SkillLevel.JOURNEYMAN)).toBe('root');
    expect(service.computeEntryLevel(51, SkillLevel.JOURNEYMAN)).toBe(
      'intermediate',
    );
  });

  it('promotes advanced attempts at 50% and above to advanced', () => {
    expect(service.computeEntryLevel(50, SkillLevel.MASTER)).toBe('advanced');
    expect(service.computeEntryLevel(49, SkillLevel.MASTER)).toBe(
      'intermediate',
    );
  });
});
