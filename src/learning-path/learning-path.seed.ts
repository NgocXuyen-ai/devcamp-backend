import { Types } from 'mongoose';
import {
    CareerField,
    LessonLevel,
    NodeType,
    QuestionDifficulty,
} from '../common/enums';

/**
 * SEED DATA — Roadmap Frontend & Backend mặc định.
 *
 * Title của từng node PHẢI khớp chính xác (từng ký tự) với mảng FRONTEND /
 * BACKEND hard-code trong FE (`src/components/RoadmapViewer.tsx`). FE dùng
 * 2 mảng đó làm fallback hiển thị khi chưa load được dữ liệu thật từ backend
 * — một khi backend đã có Roadmap + đủ 30 node cho field tương ứng, FE sẽ
 * chuyển hẳn sang dùng dữ liệu thật (kèm _id thật, cho phép progress/unlock
 * hoạt động đúng), nhưng vẫn hiển thị đúng tên bài như trước đó.
 *
 * Nếu sửa title ở một bên (FE hoặc file này), phải sửa khớp cả hai bên,
 * nếu không FE sẽ hiển thị lệch tên giữa lúc loading (mock) và sau khi
 * load xong (dữ liệu thật).
 */

type SeedNodeInput = {
    title: string;
    type: NodeType;
};

const PROJECT_TYPE = NodeType.MINI_PROJECT;
const LESSON_TYPE = NodeType.LESSON;

const FRONTEND_TITLES: SeedNodeInput[] = [
    { title: 'Web & Internet Basics', type: LESSON_TYPE },
    { title: 'Basic HTML Structure', type: LESSON_TYPE },
    { title: 'HTML Forms & Tables', type: LESSON_TYPE },
    { title: 'Project: Personal Profile', type: PROJECT_TYPE },
    { title: 'Intro to CSS & Selectors', type: LESSON_TYPE },
    { title: 'CSS Box Model & Colors', type: LESSON_TYPE },
    { title: 'Project: Registration Form', type: PROJECT_TYPE },
    { title: 'CSS Flexbox', type: LESSON_TYPE },
    { title: 'CSS Grid Basics', type: LESSON_TYPE },
    { title: 'Project: Responsive Landing Page', type: PROJECT_TYPE },

    { title: 'JavaScript Basics & Variables', type: LESSON_TYPE },
    { title: 'Control Flow & Functions', type: LESSON_TYPE },
    { title: 'Project: Calculator App', type: PROJECT_TYPE },
    { title: 'DOM Manipulation & Events', type: LESSON_TYPE },
    { title: 'Asynchronous JS & Promises', type: LESSON_TYPE },
    { title: 'Project: Weather App', type: PROJECT_TYPE },
    { title: 'Version Control (Git)', type: LESSON_TYPE },
    { title: 'Introduction to React', type: LESSON_TYPE },
    { title: 'React State & Props', type: LESSON_TYPE },
    { title: 'Project: Todo App in React', type: PROJECT_TYPE },

    { title: 'React Router & Navigation', type: LESSON_TYPE },
    { title: 'Advanced State (Redux/Zustand)', type: LESSON_TYPE },
    { title: 'Project: E-commerce Cart', type: PROJECT_TYPE },
    { title: 'CSS Frameworks (Tailwind)', type: LESSON_TYPE },
    { title: 'Next.js & SSR', type: LESSON_TYPE },
    { title: 'Project: Fullstack Blog', type: PROJECT_TYPE },
    { title: 'Automated Testing', type: LESSON_TYPE },
    { title: 'Performance Optimization', type: LESSON_TYPE },
    { title: 'Web Security Basics', type: LESSON_TYPE },
    { title: 'Project: Final Deployment', type: PROJECT_TYPE },
];

const BACKEND_TITLES: SeedNodeInput[] = [
    { title: 'How the Internet Works & HTTP', type: LESSON_TYPE },
    { title: 'Intro to Backend Languages', type: LESSON_TYPE },
    { title: 'Basic Syntax & Functions', type: LESSON_TYPE },
    { title: 'Project: CLI To-do List', type: PROJECT_TYPE },
    { title: 'Relational Databases & SQL', type: LESSON_TYPE },
    { title: 'Basic CRUD in SQL', type: LESSON_TYPE },
    { title: 'Project: Student DB', type: PROJECT_TYPE },
    { title: 'Version Control (Git)', type: LESSON_TYPE },
    { title: 'Asynchronous Programming', type: LESSON_TYPE },
    { title: 'Project: Basic Web Server', type: PROJECT_TYPE },

    { title: 'RESTful API Principles', type: LESSON_TYPE },
    { title: 'Building Endpoints', type: LESSON_TYPE },
    { title: 'Project: Note-taking API', type: PROJECT_TYPE },
    { title: 'Advanced SQL & Indexing', type: LESSON_TYPE },
    { title: 'ORMs (Prisma/SQLAlchemy)', type: LESSON_TYPE },
    { title: 'Project: E-commerce API', type: PROJECT_TYPE },
    { title: 'Auth Basics (Sessions)', type: LESSON_TYPE },
    { title: 'JWT & OAuth', type: LESSON_TYPE },
    { title: 'Input Validation & Errors', type: LESSON_TYPE },
    { title: 'Project: Secure Login System', type: PROJECT_TYPE },

    { title: 'Caching Strategies (Redis)', type: LESSON_TYPE },
    { title: 'Message Brokers (RabbitMQ)', type: LESSON_TYPE },
    { title: 'Project: Order Queue', type: PROJECT_TYPE },
    { title: 'Architecture & Microservices', type: LESSON_TYPE },
    { title: 'Containerization (Docker)', type: LESSON_TYPE },
    { title: 'Project: Dockerized App', type: PROJECT_TYPE },
    { title: 'Unit & Integration Testing', type: LESSON_TYPE },
    { title: 'CI/CD Pipelines', type: LESSON_TYPE },
    { title: 'Cloud Deployment', type: LESSON_TYPE },
    { title: 'Project: Final Deployment', type: PROJECT_TYPE },
];

const MILESTONE_TITLES = [
    'Beginner Foundations',
    'Intermediate Skills',
    'Advanced Mastery',
];

/** Độ khó tăng dần theo milestone (index 0 = milestone đầu = dễ nhất). */
function difficultyForMilestone(milestoneIndex: number): QuestionDifficulty {
    if (milestoneIndex === 0) return QuestionDifficulty.EASY;
    if (milestoneIndex === 1) return QuestionDifficulty.MEDIUM;
    return QuestionDifficulty.HARD;
}

export type SeedRoadmapNode = {
    roadmapId: Types.ObjectId;
    milestoneOrder: number;
    order: number;
    title: string;
    type: NodeType;
    difficulty: QuestionDifficulty;
    content: {
        theory?: string;
        attachments: string[];
        questionIds: Types.ObjectId[];
    };
    unlockCondition: {
        prerequisiteNodeIds: Types.ObjectId[];
        minScore: number;
        requiresBattleWin: boolean;
    };
    estimatedMinutes: number;
    rewardXp: number;
    rewardCoins: number;
    tags: string[];
    isPublished: boolean;
};

export type SeedRoadmap = {
    title: string;
    description: string;
    field: CareerField;
    level: LessonLevel;
    totalLessons: number;
    totalEstimatedHours: number;
    isActive: boolean;
    version: number;
    milestones: Array<{
        title: string;
        description: string;
        order: number;
        nodeIds: Types.ObjectId[];
        gateType: string;
        rewardXp: number;
        rewardCoins: number;
    }>;
};

/**
 * Build toàn bộ Roadmap + RoadmapNode cho một field (frontend/backend).
 * Sinh sẵn _id cho từng node ở phía client (thay vì để Mongo tự sinh) để
 * có thể gắn nodeIds vào milestones ngay trong cùng một lần build, không
 * cần round-trip DB giữa hai bước insert.
 */
export function buildRoadmapSeed(
    field: CareerField,
    titles: SeedNodeInput[],
): { roadmap: SeedRoadmap; nodes: SeedRoadmapNode[] } {
    const roadmapId = new Types.ObjectId();
    const nodeIds = titles.map(() => new Types.ObjectId());

    const nodes: SeedRoadmapNode[] = titles.map((item, index) => {
        const milestoneIndex = Math.floor(index / 10); // 0, 1, 2
        const orderInMilestone = (index % 10) + 1; // 1..10

        return {
            roadmapId,
            milestoneOrder: milestoneIndex + 1,
            order: orderInMilestone,
            title: item.title,
            type: item.type,
            difficulty: difficultyForMilestone(milestoneIndex),
            content: { attachments: [], questionIds: [] },
            unlockCondition: {
                prerequisiteNodeIds: index > 0 ? [nodeIds[index - 1]] : [],
                minScore: 0,
                requiresBattleWin: false,
            },
            estimatedMinutes: item.type === PROJECT_TYPE ? 90 : 30,
            rewardXp: item.type === PROJECT_TYPE ? 200 : 100,
            rewardCoins: item.type === PROJECT_TYPE ? 20 : 10,
            tags: [],
            isPublished: true,
        };
    });

    // Gán lại _id đã sinh sẵn — insertMany sẽ tôn trọng _id được truyền vào
    // thay vì tự sinh mới, nên các tham chiếu nodeIds/prerequisiteNodeIds ở
    // trên vẫn khớp đúng document thật sau khi insert.
    const nodesWithId = nodes.map((node, index) => ({
        ...node,
        _id: nodeIds[index],
    }));

    const milestones = [0, 1, 2].map((milestoneIndex) => ({
        title: MILESTONE_TITLES[milestoneIndex],
        description: '',
        order: milestoneIndex + 1,
        nodeIds: nodeIds.slice(milestoneIndex * 10, milestoneIndex * 10 + 10),
        gateType: 'project',
        rewardXp: 500,
        rewardCoins: 50,
    }));

    const fieldLabel = field === CareerField.FRONTEND ? 'Frontend' : 'Backend';

    const roadmap: SeedRoadmap & { _id: Types.ObjectId } = {
        _id: roadmapId,
        title: `${fieldLabel} Roadmap`,
        description: `Lộ trình học ${fieldLabel} từ nền tảng tới nâng cao.`,
        field,
        level: LessonLevel.ROOT,
        totalLessons: titles.length,
        totalEstimatedHours: 120,
        isActive: true,
        version: 1,
        milestones,
    };

    return { roadmap, nodes: nodesWithId };
}

export function buildFrontendRoadmapSeed() {
    return buildRoadmapSeed(CareerField.FRONTEND, FRONTEND_TITLES);
}

export function buildBackendRoadmapSeed() {
    return buildRoadmapSeed(CareerField.BACKEND, BACKEND_TITLES);
}