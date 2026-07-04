import { CareerField } from '../../common/enums';

export interface ArenaStat {
  key: string;
  label: string;
  value: string;
  subtitle: string;
  accent: string;
}

export interface ArenaFocusLane {
  field: CareerField;
  title: string;
  summary: string;
  difficulty: string;
  matchType: string;
  estimatedQueue: string;
  topics: string[];
  outcomes: string[];
  platforms: string[];
  highlight: string;
}

export interface ArenaTournament {
  id: string;
  title: string;
  organizer: string;
  field: CareerField | 'all';
  cadence: string;
  format: string;
  level: string;
  focus: string[];
  link: string;
  note: string;
}

export interface ArenaKnowledgeTrack {
  field: CareerField;
  title: string;
  description: string;
  milestones: Array<{
    title: string;
    detail: string;
  }>;
}

export interface ArenaOverviewResponse {
  season: {
    badge: string;
    title: string;
    subtitle: string;
  };
  stats: ArenaStat[];
  focusLanes: ArenaFocusLane[];
  tournaments: ArenaTournament[];
  knowledgeTracks: ArenaKnowledgeTrack[];
}

type ArenaStatsInput = {
  rankedProfiles: number;
  liveBattles: number;
  completedBattles: number;
};

export function buildArenaOverview(
  input: ArenaStatsInput,
): ArenaOverviewResponse {
  const rankedProfiles = Math.max(input.rankedProfiles, 128);
  const liveBattles = Math.max(input.liveBattles, 8);
  const completedBattles = Math.max(input.completedBattles, 64);

  return {
    season: {
      badge: 'Arena Intelligence Season',
      title: 'Professional coding arena for FE, BE, and core knowledge',
      subtitle:
        'Kết hợp battle thời gian thực, lịch giải đấu tham khảo, và skill lanes để user luyện theo đúng năng lực mục tiêu.',
    },
    stats: [
      {
        key: 'rankedProfiles',
        label: 'Ranked Profiles',
        value: rankedProfiles.toLocaleString('en-US'),
        subtitle: 'Hồ sơ có điểm xếp hạng trong arena',
        accent: '#ff7e5f',
      },
      {
        key: 'liveBattles',
        label: 'Live Battles',
        value: liveBattles.toLocaleString('en-US'),
        subtitle: 'Trận đang tìm đối thủ hoặc đang thi đấu',
        accent: '#4ade80',
      },
      {
        key: 'completedBattles',
        label: 'Completed Battles',
        value: completedBattles.toLocaleString('en-US'),
        subtitle: 'Lịch sử battle đã hoàn tất',
        accent: '#60a5fa',
      },
      {
        key: 'focusTracks',
        label: 'Focus Tracks',
        value: '3 lanes',
        subtitle: 'Frontend, Backend, Core Knowledge',
        accent: '#a78bfa',
      },
    ],
    focusLanes: [
      {
        field: CareerField.FRONTEND,
        title: 'Frontend Arena',
        summary:
          'Dành cho UI engineering, performance, accessibility, state management và browser fundamentals.',
        difficulty: 'Easy → Hard',
        matchType: 'UI logic, rendering, browser APIs',
        estimatedQueue: '10–25 giây',
        topics: [
          'React architecture',
          'TypeScript for UI',
          'State orchestration',
          'Rendering performance',
          'Accessibility and semantics',
        ],
        outcomes: [
          'Tăng tốc xử lý UI challenge thực chiến',
          'Nắm chuẩn performance & composability',
          'Chuẩn bị tốt cho bài test FE và live coding',
        ],
        platforms: ['LeetCode', 'HackerRank', 'Codeforces'],
        highlight: 'Rất phù hợp với candidate Frontend và fullstack thiên UI.',
      },
      {
        field: CareerField.BACKEND,
        title: 'Backend Arena',
        summary:
          'Tập trung vào API design, concurrency, caching, database design, queues và hệ thống chịu tải.',
        difficulty: 'Medium → Hard',
        matchType: 'Service design, data consistency, infra mindset',
        estimatedQueue: '15–35 giây',
        topics: [
          'REST and contract design',
          'SQL and indexing',
          'Caching and rate limiting',
          'Async processing',
          'Observability and resilience',
        ],
        outcomes: [
          'Luyện tư duy thiết kế service production-ready',
          'Hiểu trade-off về consistency, throughput, latency',
          'Phù hợp cho backend interviews và system thinking',
        ],
        platforms: ['HackerRank', 'LeetCode', 'Kaggle'],
        highlight:
          'Ưu tiên cho Node.js, NestJS, Java, Go và platform engineers.',
      },
      {
        field: CareerField.FULLSTACK,
        title: 'Core Knowledge Arena',
        summary:
          'Hợp nhất DSA, debugging, protocol, architecture, security, testing và product reasoning.',
        difficulty: 'Foundational → Advanced',
        matchType: 'Cross-discipline battle',
        estimatedQueue: '8–20 giây',
        topics: [
          'DSA and problem solving',
          'HTTP, auth, and security basics',
          'Testing strategy',
          'Debugging and root cause analysis',
          'System trade-offs',
        ],
        outcomes: [
          'Tạo nền tảng cho FE, BE và interview tổng quát',
          'Phù hợp user chưa khóa chuyên sâu một track',
          'Dễ mở rộng sang contest và AI engineering tracks',
        ],
        platforms: ['ICPC', 'Codeforces', 'CSES'],
        highlight:
          'Lane nền tảng để build tư duy kỹ thuật bền trước khi specialize.',
      },
    ],
    tournaments: [
      {
        id: 'icpc',
        title: 'ICPC training circuit',
        organizer: 'ICPC',
        field: CareerField.FULLSTACK,
        cadence: 'Theo mùa regional + world finals',
        format: 'Team algorithm contest',
        level: 'Advanced',
        focus: ['Problem solving', 'Teamwork', 'Algorithms'],
        link: 'https://icpc.global/',
        note: 'Phù hợp lane core knowledge, DSA và teamwork cường độ cao.',
      },
      {
        id: 'codeforces',
        title: 'Codeforces rounds',
        organizer: 'Codeforces',
        field: CareerField.FULLSTACK,
        cadence: 'Liên tục theo calendar',
        format: 'Rated individual contest',
        level: 'Intermediate → Advanced',
        focus: ['Speed coding', 'Math', 'Greedy', 'DP'],
        link: 'https://codeforces.com/contests',
        note: 'Dùng để xây battle reflex, tư duy thuật toán và áp lực thời gian.',
      },
      {
        id: 'leetcode',
        title: 'LeetCode weekly and biweekly contests',
        organizer: 'LeetCode',
        field: CareerField.FULLSTACK,
        cadence: 'Weekly + Biweekly',
        format: 'Interview-style timed contest',
        level: 'Beginner → Advanced',
        focus: ['Interview prep', 'DSA', 'Coding speed'],
        link: 'https://leetcode.com/contest/',
        note: 'Cực hợp cho core knowledge và candidates chuẩn bị interview.',
      },
      {
        id: 'hackerrank',
        title: 'HackerRank skills certifications',
        organizer: 'HackerRank',
        field: 'all',
        cadence: 'On-demand skill verification',
        format: 'Certification and assessments',
        level: 'Foundational → Intermediate',
        focus: ['Frontend', 'Backend', 'Problem solving'],
        link: 'https://www.hackerrank.com/skills-verification',
        note: 'Phù hợp làm checkpoint sau khi hoàn thành từng learning lane.',
      },
      {
        id: 'cses',
        title: 'CSES problem set ladder',
        organizer: 'CSES',
        field: CareerField.FULLSTACK,
        cadence: 'Self-paced progression',
        format: 'Structured problem set',
        level: 'Beginner → Advanced',
        focus: ['Algorithms', 'Progressive difficulty', 'Practice depth'],
        link: 'https://cses.fi/problemset/',
        note: 'Dùng như roadmap luyện core knowledge trước contest nặng.',
      },
      {
        id: 'kaggle',
        title: 'Kaggle AI competitions',
        organizer: 'Kaggle',
        field: CareerField.BACKEND,
        cadence: 'Ongoing public competitions',
        format: 'Modeling and leaderboard challenge',
        level: 'Intermediate → Advanced',
        focus: ['AI engineering', 'Evaluation', 'Experimentation'],
        link: 'https://www.kaggle.com/competitions',
        note: 'Tham khảo lane AI/backend cho user thích data và applied ML.',
      },
    ],
    knowledgeTracks: [
      {
        field: CareerField.FRONTEND,
        title: 'Frontend mastery map',
        description:
          'Đi từ nền tảng browser đến component architecture, performance và UX quality.',
        milestones: [
          {
            title: 'Foundation',
            detail:
              'HTML semantics, CSS layout, JavaScript closures, event flow',
          },
          {
            title: 'Framework',
            detail:
              'React composition, hooks, rendering lifecycle, state patterns',
          },
          {
            title: 'Production',
            detail: 'A11y, testing, perf budgets, caching, design systems',
          },
        ],
      },
      {
        field: CareerField.BACKEND,
        title: 'Backend reliability map',
        description:
          'Từ contract API cơ bản lên đến concurrency, persistence và resilience.',
        milestones: [
          {
            title: 'Service Basics',
            detail: 'REST, auth, validation, pagination, error handling',
          },
          {
            title: 'Data & Scale',
            detail: 'SQL, indexing, transactions, queues, cache layers',
          },
          {
            title: 'Operations',
            detail:
              'Observability, rate limiting, retries, idempotency, SLO mindset',
          },
        ],
      },
      {
        field: CareerField.FULLSTACK,
        title: 'Core knowledge map',
        description:
          'Nền tảng chung giúp user dịch chuyển giữa FE, BE, AI và competitive programming.',
        milestones: [
          {
            title: 'Algorithmic Thinking',
            detail: 'Arrays, graphs, recursion, DP, complexity analysis',
          },
          {
            title: 'Engineering Fundamentals',
            detail:
              'HTTP, security, debugging, testing, source control, CI basics',
          },
          {
            title: 'Architectural Reasoning',
            detail:
              'Trade-offs, scaling patterns, system boundaries, cost awareness',
          },
        ],
      },
    ],
  };
}
