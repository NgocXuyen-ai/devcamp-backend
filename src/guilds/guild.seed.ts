import { GuildType } from './schemas/guild.schema';

type SeedGuild = {
  name: string;
  type: GuildType;
  members: number;
  maxMembers: number;
  level: number;
  xp: number;
  xpNext: number;
  rank: number;
  winRate: number;
  founded: string;
  openToJoin: boolean;
  featured?: boolean;
  description: string;
  mission: string;
  weeklyXP: number;
  tags: string[];
  language: string;
  headquarters: string;
  recruitmentPitch: string;
  initials: string[];
  quests: Array<{
    questId: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    progress: number;
    total: number;
    rewardXp: number;
    rewardCoins: number;
    dueInDays: number;
  }>;
};

export const TYPE_COLORS: Record<GuildType, string> = {
  Backend: '#a78bfa',
  Frontend: '#ff7e5f',
  'Data Science': '#4ade80',
  DevOps: '#38bdf8',
  Security: '#f472b6',
  Mobile: '#fb923c',
};

const TYPE_PERKS: Record<GuildType, string[]> = {
  Backend: [
    'API review room riêng cho core members',
    'Weekly system design sparring',
    'Battle bonus cho ranked backend challenges',
  ],
  Frontend: [
    'UI critique session mỗi tuần',
    'Shared component patterns và motion library',
    'Battle bonus cho accessibility & performance',
  ],
  'Data Science': [
    'Dataset lab và model review',
    'Notebook showcase mỗi tuần',
    'Battle bonus cho ML / analytics missions',
  ],
  DevOps: [
    'Infra office hours và runbook templates',
    'CI/CD review squad',
    'Battle bonus cho reliability challenges',
  ],
  Security: [
    'Private CTF discussion board',
    'Threat-model review squad',
    'Battle bonus cho security puzzle chains',
  ],
  Mobile: [
    'App teardown và UX clinic',
    'Release checklist templates',
    'Battle bonus cho mobile optimization quests',
  ],
};

const TYPE_REQUIREMENTS: Record<
  GuildType,
  Array<{ label: string; value: string }>
> = {
  Backend: [
    {
      label: 'Stack fit',
      value: 'Node.js, Java, Go hoặc database-heavy workflows',
    },
    { label: 'Mindset', value: 'Ưa clean architecture và performance tuning' },
    { label: 'Weekly target', value: 'Tối thiểu 3 battle hoặc 1 guild quest' },
  ],
  Frontend: [
    {
      label: 'Stack fit',
      value: 'React, Vue, CSS systems hoặc UI engineering',
    },
    {
      label: 'Mindset',
      value: 'Chăm chút accessibility, UX và interaction detail',
    },
    { label: 'Weekly target', value: 'Tối thiểu 3 battle hoặc 1 UI challenge' },
  ],
  'Data Science': [
    {
      label: 'Stack fit',
      value: 'Python, SQL, ML hoặc data analysis pipelines',
    },
    { label: 'Mindset', value: 'Data-first, thích đào insight và đo lường' },
    {
      label: 'Weekly target',
      value: 'Tối thiểu 2 analysis mission hoặc 1 model quest',
    },
  ],
  DevOps: [
    { label: 'Stack fit', value: 'Docker, CI/CD, cloud hoặc SRE workflows' },
    { label: 'Mindset', value: 'Tự động hóa, reliability và observability' },
    {
      label: 'Weekly target',
      value: 'Tối thiểu 2 ops challenge hoặc 1 guild quest',
    },
  ],
  Security: [
    {
      label: 'Stack fit',
      value: 'CTF, pentest, secure coding hoặc reverse engineering',
    },
    { label: 'Mindset', value: 'Cẩn trọng, thích phân tích và đào sâu' },
    {
      label: 'Weekly target',
      value: 'Tối thiểu 2 security puzzle hoặc 1 guild quest',
    },
  ],
  Mobile: [
    { label: 'Stack fit', value: 'iOS, Android, Flutter hoặc React Native' },
    {
      label: 'Mindset',
      value: 'Obsessed với UX, release quality và smoothness',
    },
    {
      label: 'Weekly target',
      value: 'Tối thiểu 2 mobile challenge hoặc 1 guild quest',
    },
  ],
};

const ROLE_LABELS = [
  'Guild Lead',
  'Strategist',
  'Mentor',
  'Core Member',
  'Builder',
];
const TITLE_LABELS = [
  'Quest Captain',
  'Battle Analyst',
  'Review Mentor',
  'Sprint Driver',
  'Community Anchor',
];
const NAME_MAP: Record<string, string> = {
  A: 'Aiden',
  B: 'Bao',
  C: 'Cora',
  D: 'Duy',
  E: 'Eli',
  F: 'Finn',
  G: 'Gia',
  H: 'Hana',
  I: 'Ian',
  J: 'Jade',
  K: 'Kai',
  L: 'Luna',
  M: 'Minh',
  N: 'Nora',
  O: 'Owen',
  P: 'Phuc',
  Q: 'Quinn',
  R: 'Rio',
  S: 'Sora',
  T: 'Tina',
  U: 'Uma',
  V: 'Vy',
  W: 'Will',
  X: 'Xuan',
  Y: 'Yuri',
  Z: 'Zane',
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function avatarFor(name: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    name,
  )}`;
}

function makeFeaturedMembers(initials: string[], guildName: string) {
  return initials.slice(0, 5).map((initial, index) => {
    const username = `${NAME_MAP[initial] ?? initial}${index === 0 ? '' : ` ${initial}`}`;
    return {
      username,
      title: TITLE_LABELS[index % TITLE_LABELS.length],
      roleLabel: ROLE_LABELS[index % ROLE_LABELS.length],
      initials: initial,
      avatarUrl: avatarFor(`${guildName}-${username}`),
      contributionXp: 9000 - index * 1100,
      joinedAt: new Date(Date.now() - (index + 8) * 86_400_000),
    };
  });
}

function makeActivityFeed(seed: SeedGuild) {
  return [
    {
      type: 'achievement',
      title: `${seed.name} giữ top ${seed.rank}`,
      description: `Bang hội vừa kết thúc tuần với ${seed.weeklyXP.toLocaleString()} XP.`,
      createdAt: new Date(Date.now() - 2 * 3_600_000),
    },
    {
      type: 'quest',
      title: `Quest board của ${seed.type} được cập nhật`,
      description: `Đã làm mới ${seed.quests.length} nhiệm vụ chuyên môn cho tuần này.`,
      createdAt: new Date(Date.now() - 10 * 3_600_000),
    },
    {
      type: 'community',
      title: 'Review session đã mở',
      description: `Mentor squad của ${seed.name} đang mở một review room mới cho thành viên.`,
      createdAt: new Date(Date.now() - 28 * 3_600_000),
    },
  ];
}

const BASE_GUILDS: SeedGuild[] = [
  {
    name: 'The Void Walkers',
    members: 1240,
    maxMembers: 1500,
    level: 42,
    xp: 87400,
    xpNext: 100000,
    type: 'Backend',
    rank: 1,
    winRate: 74,
    founded: '2023',
    openToJoin: true,
    featured: true,
    description:
      'Elite backend engineers mastering distributed systems, API design, and high-performance architecture.',
    mission:
      'Xây một guild dành cho những backend engineer thích battle khó, review kỹ và tối ưu tới cùng.',
    weeklyXP: 12400,
    tags: ['Node.js', 'Go', 'PostgreSQL', 'Redis'],
    language: 'Go / Node.js',
    headquarters: 'Singapore',
    recruitmentPitch:
      'Phù hợp với dev thích API, database và scale system. Chúng tôi ưu tiên người chịu review và phối hợp tốt.',
    initials: ['V', 'B', 'S', 'K', 'R'],
    quests: [
      {
        questId: 'backend-ranked-50',
        title: 'Win 50 ranked backend battles',
        description:
          'Giữ lợi thế ở bảng rank backend bằng chuỗi battle có kiểm soát.',
        category: 'Ranked',
        difficulty: 'Hard',
        progress: 38,
        total: 50,
        rewardXp: 5000,
        rewardCoins: 250,
        dueInDays: 6,
      },
      {
        questId: 'backend-review-10',
        title: 'Complete 10 guild reviews',
        description:
          'Review pull request và giải thích trade-off thật rõ ràng.',
        category: 'Review',
        difficulty: 'Medium',
        progress: 10,
        total: 10,
        rewardXp: 2500,
        rewardCoins: 100,
        dueInDays: 3,
      },
    ],
  },
  {
    name: 'Pixel Pioneers',
    members: 890,
    maxMembers: 1000,
    level: 35,
    xp: 62000,
    xpNext: 75000,
    type: 'Frontend',
    rank: 2,
    winRate: 68,
    founded: '2023',
    openToJoin: true,
    description:
      'Crafting beautiful UIs and pixel-perfect experiences. React, Vue, design systems — we do it all.',
    mission:
      'Giúp frontend dev lên tay thật nhanh qua battle, critique và challenge về UI performance.',
    weeklyXP: 9800,
    tags: ['React', 'Vue', 'TypeScript', 'CSS'],
    language: 'TypeScript',
    headquarters: 'Ho Chi Minh City',
    recruitmentPitch:
      'Nếu bạn mê design system, accessibility và interaction mượt, đây là guild rất hợp để phát triển.',
    initials: ['P', 'A', 'L', 'M', 'E'],
    quests: [
      {
        questId: 'frontend-js-30',
        title: 'Win 30 JavaScript battles',
        description:
          'Duy trì phong độ trong các trận frontend logic và UI debugging.',
        category: 'Ranked',
        difficulty: 'Medium',
        progress: 22,
        total: 30,
        rewardXp: 3000,
        rewardCoins: 150,
        dueInDays: 5,
      },
      {
        questId: 'frontend-a11y-5',
        title: 'Ship 5 accessibility fixes',
        description: 'Chinh phục các lỗi keyboard nav, semantics và contrast.',
        category: 'Craft',
        difficulty: 'Easy',
        progress: 5,
        total: 5,
        rewardXp: 1800,
        rewardCoins: 90,
        dueInDays: 4,
      },
    ],
  },
  {
    name: 'Data Dragons',
    members: 560,
    maxMembers: 750,
    level: 28,
    xp: 41000,
    xpNext: 55000,
    type: 'Data Science',
    rank: 3,
    winRate: 61,
    founded: '2024',
    openToJoin: false,
    description:
      'Python wizards and ML practitioners. We train models, crunch datasets, and dominate analytics challenges.',
    mission:
      'Biến data thành lợi thế cạnh tranh bằng ML pipelines, notebooks rõ ràng và insight thực chiến.',
    weeklyXP: 7200,
    tags: ['Python', 'PyTorch', 'Pandas', 'SQL'],
    language: 'Python',
    headquarters: 'Seoul',
    recruitmentPitch:
      'Guild đang full nhưng phù hợp với ai thích dataset khó, model evaluation và storytelling bằng dữ liệu.',
    initials: ['D', 'N', 'C', 'T'],
    quests: [
      {
        questId: 'ds-submit-20',
        title: 'Submit 20 Python solutions',
        description: 'Đẩy tốc độ giải bài và clean notebook cho cả team.',
        category: 'Analysis',
        difficulty: 'Medium',
        progress: 14,
        total: 20,
        rewardXp: 2000,
        rewardCoins: 110,
        dueInDays: 6,
      },
    ],
  },
  {
    name: 'Kernel Panic',
    members: 430,
    maxMembers: 600,
    level: 31,
    xp: 51000,
    xpNext: 60000,
    type: 'DevOps',
    rank: 4,
    winRate: 65,
    founded: '2024',
    openToJoin: true,
    description:
      'Infra warriors who live in the terminal. Docker, K8s, CI/CD pipelines are our battleground.',
    mission:
      'Đào tạo những devops engineer có thể tự tin làm deployment, automation và incident review.',
    weeklyXP: 6100,
    tags: ['Docker', 'Kubernetes', 'Terraform', 'AWS'],
    language: 'Bash / YAML',
    headquarters: 'Bangkok',
    recruitmentPitch:
      'Guild tuyển những người thích hạ tầng, terminal và muốn tăng tốc về cloud hoặc CI/CD.',
    initials: ['K', 'J', 'O', 'F', 'H'],
    quests: [
      {
        questId: 'devops-system-15',
        title: 'Complete 15 system challenges',
        description: 'Tăng tốc tư duy reliability và incident response.',
        category: 'Operations',
        difficulty: 'Hard',
        progress: 9,
        total: 15,
        rewardXp: 3500,
        rewardCoins: 180,
        dueInDays: 7,
      },
    ],
  },
  {
    name: 'Shadow Protocol',
    members: 310,
    maxMembers: 400,
    level: 24,
    xp: 29000,
    xpNext: 40000,
    type: 'Security',
    rank: 5,
    winRate: 58,
    founded: '2024',
    openToJoin: true,
    description:
      'CTF champions and ethical hackers. We find vulnerabilities before the bad guys do.',
    mission:
      'Tập trung vào secure coding, exploit thinking và phản xạ phân tích lỗ hổng bài bản.',
    weeklyXP: 5300,
    tags: ['CTF', 'Pentesting', 'Cryptography', 'Rust'],
    language: 'Python / Rust',
    headquarters: 'Tokyo',
    recruitmentPitch:
      'Rất hợp cho người thích security challenge, CTF, exploit mindset và reverse engineering cơ bản.',
    initials: ['S', 'X', 'Z', 'Q'],
    quests: [
      {
        questId: 'security-puzzles-10',
        title: 'Solve 10 security puzzles',
        description: 'Giữ nhịp luyện tư duy exploit và secure coding mỗi tuần.',
        category: 'Security',
        difficulty: 'Medium',
        progress: 6,
        total: 10,
        rewardXp: 4000,
        rewardCoins: 220,
        dueInDays: 5,
      },
    ],
  },
  {
    name: 'Swift Nomads',
    members: 275,
    maxMembers: 350,
    level: 19,
    xp: 18000,
    xpNext: 28000,
    type: 'Mobile',
    rank: 6,
    winRate: 55,
    founded: '2024',
    openToJoin: false,
    description:
      'iOS and Android artisans. Building mobile-first, performance-obsessed native experiences.',
    mission:
      'Đẩy chuẩn mobile craftsmanship: mượt, gọn, release kỹ và tối ưu trải nghiệm thực tế.',
    weeklyXP: 4100,
    tags: ['Swift', 'Kotlin', 'React Native', 'Flutter'],
    language: 'Swift / Kotlin',
    headquarters: 'Taipei',
    recruitmentPitch:
      'Guild thiên về mobile craftsmanship, release discipline và performance trên thiết bị thật.',
    initials: ['W', 'I', 'R', 'Y'],
    quests: [
      {
        questId: 'mobile-battle-20',
        title: 'Win 20 mobile battles',
        description:
          'Tập trung battle liên quan tới mobile debugging và optimization.',
        category: 'Mobile',
        difficulty: 'Medium',
        progress: 11,
        total: 20,
        rewardXp: 2500,
        rewardCoins: 130,
        dueInDays: 7,
      },
    ],
  },
  {
    name: 'Iron Servers',
    members: 720,
    maxMembers: 900,
    level: 38,
    xp: 74000,
    xpNext: 90000,
    type: 'Backend',
    rank: 7,
    winRate: 70,
    founded: '2023',
    openToJoin: true,
    description:
      'Scalability-first engineers. Microservices, event-driven architecture, and low-latency APIs.',
    mission:
      'Đưa các backend engineer từ level tốt lên level rất cứng trong scalability và service design.',
    weeklyXP: 10200,
    tags: ['Java', 'Kafka', 'Spring Boot', 'MongoDB'],
    language: 'Java / Kotlin',
    headquarters: 'Berlin',
    recruitmentPitch:
      'Một guild hợp với người thích microservices, event-driven systems và backend performance.',
    initials: ['I', 'R', 'O', 'N', 'S'],
    quests: [
      {
        questId: 'backend-microservice-5',
        title: 'Deploy 5 microservices',
        description:
          'Thành viên cùng hoàn thiện service boundaries và deployment flow.',
        category: 'Architecture',
        difficulty: 'Hard',
        progress: 3,
        total: 5,
        rewardXp: 3500,
        rewardCoins: 180,
        dueInDays: 6,
      },
    ],
  },
  {
    name: 'Cascade Guild',
    members: 410,
    maxMembers: 600,
    level: 27,
    xp: 38000,
    xpNext: 52000,
    type: 'Frontend',
    rank: 8,
    winRate: 63,
    founded: '2024',
    openToJoin: true,
    description:
      'CSS masters, animation specialists, and accessibility advocates building the web of tomorrow.',
    mission:
      'Biến front-end thành lợi thế rõ rệt bằng motion, accessibility và UI quality có hệ thống.',
    weeklyXP: 6800,
    tags: ['CSS', 'Svelte', 'GSAP', 'WebGL'],
    language: 'JavaScript / CSS',
    headquarters: 'Da Nang',
    recruitmentPitch:
      'Nếu bạn thích animation, interaction và UX polish, guild này sẽ cho nhiều bài tập rất đáng tiền.',
    initials: ['C', 'A', 'S', 'C'],
    quests: [
      {
        questId: 'frontend-animated-5',
        title: 'Build 5 animated components',
        description:
          'Tạo component motion mượt và vẫn giữ trải nghiệm tốt trên máy yếu.',
        category: 'Craft',
        difficulty: 'Medium',
        progress: 4,
        total: 5,
        rewardXp: 2000,
        rewardCoins: 120,
        dueInDays: 5,
      },
    ],
  },
  {
    name: 'Neural Nomads',
    members: 340,
    maxMembers: 500,
    level: 22,
    xp: 24000,
    xpNext: 35000,
    type: 'Data Science',
    rank: 9,
    winRate: 57,
    founded: '2024',
    openToJoin: true,
    description:
      'Deep learning researchers and NLP practitioners pushing state-of-the-art on every dataset.',
    mission:
      'Giữ tinh thần research nhưng vẫn bám thực tế production, evaluation và deployment reasoning.',
    weeklyXP: 5600,
    tags: ['TensorFlow', 'NLP', 'HuggingFace', 'Jupyter'],
    language: 'Python',
    headquarters: 'Hanoi',
    recruitmentPitch:
      'Guild rất hợp cho người thích deep learning, NLP, experimentation và benchmark model.',
    initials: ['N', 'E', 'U', 'R'],
    quests: [
      {
        questId: 'ds-models-3',
        title: 'Train 3 production models',
        description:
          'Đi từ dataset sạch tới evaluation rõ ràng và release được.',
        category: 'ML',
        difficulty: 'Hard',
        progress: 1,
        total: 3,
        rewardXp: 5000,
        rewardCoins: 260,
        dueInDays: 7,
      },
    ],
  },
  {
    name: 'Cloud Riders',
    members: 285,
    maxMembers: 400,
    level: 25,
    xp: 32000,
    xpNext: 44000,
    type: 'DevOps',
    rank: 10,
    winRate: 60,
    founded: '2024',
    openToJoin: false,
    description:
      'Multi-cloud architects and SRE veterans. Zero-downtime deployments are our standard.',
    mission:
      'Tạo ra những devops engineer hiểu rollout, rollback, metrics và incident hygiene cực chắc.',
    weeklyXP: 4800,
    tags: ['GCP', 'Ansible', 'Helm', 'Prometheus'],
    language: 'Python / HCL',
    headquarters: 'Sydney',
    recruitmentPitch:
      'Cloud Riders ưu tiên thành viên có ý thức cao về observability, automation và release discipline.',
    initials: ['C', 'L', 'O', 'U', 'D'],
    quests: [
      {
        questId: 'devops-monitoring-3',
        title: 'Set up 3 monitoring stacks',
        description: 'Chuẩn hóa alerting, dashboard và incident learnings.',
        category: 'Reliability',
        difficulty: 'Medium',
        progress: 2,
        total: 3,
        rewardXp: 4500,
        rewardCoins: 230,
        dueInDays: 4,
      },
    ],
  },
  {
    name: 'Red Team Zero',
    members: 195,
    maxMembers: 250,
    level: 20,
    xp: 20000,
    xpNext: 30000,
    type: 'Security',
    rank: 11,
    winRate: 54,
    founded: '2024',
    openToJoin: true,
    description:
      'Offensive security specialists. Binary exploitation, malware analysis, and red team ops.',
    mission:
      'Đào sâu vào offensive security, binary analysis và các bài battle thiên về exploit thinking.',
    weeklyXP: 3900,
    tags: ['Reverse Engineering', 'Assembly', 'GDB', 'Binary Exploit'],
    language: 'C / Python',
    headquarters: 'Manila',
    recruitmentPitch:
      'Rất hợp cho ai muốn vào offensive security nghiêm túc, chấp nhận học kỹ và debug rất sâu.',
    initials: ['R', 'T', 'Z', 'E'],
    quests: [
      {
        questId: 'security-binary-5',
        title: 'Complete 5 binary exploit labs',
        description:
          'Luyện đọc binary, trace stack và khai thác lỗi có kiểm soát.',
        category: 'Reverse Engineering',
        difficulty: 'Hard',
        progress: 2,
        total: 5,
        rewardXp: 6000,
        rewardCoins: 300,
        dueInDays: 7,
      },
    ],
  },
  {
    name: 'Flutterflies',
    members: 180,
    maxMembers: 250,
    level: 16,
    xp: 13000,
    xpNext: 20000,
    type: 'Mobile',
    rank: 12,
    winRate: 50,
    founded: '2025',
    openToJoin: true,
    description:
      'Cross-platform mobile enthusiasts. One codebase, beautiful experiences on every device.',
    mission:
      'Tập trung tối ưu tốc độ ship app đa nền tảng mà vẫn giữ chất lượng trải nghiệm và codebase gọn.',
    weeklyXP: 2800,
    tags: ['Flutter', 'Dart', 'Firebase', 'GetX'],
    language: 'Dart',
    headquarters: 'Jakarta',
    recruitmentPitch:
      'Guild dành cho dev yêu thích cross-platform và muốn rèn release discipline thực tế hơn.',
    initials: ['F', 'L', 'T', 'R'],
    quests: [
      {
        questId: 'mobile-flutter-2',
        title: 'Publish 2 Flutter apps',
        description: 'Đi từ prototype tới release checklist hoàn chỉnh.',
        category: 'Shipping',
        difficulty: 'Medium',
        progress: 1,
        total: 2,
        rewardXp: 4000,
        rewardCoins: 200,
        dueInDays: 6,
      },
    ],
  },
];

export function buildGuildSeedData() {
  return BASE_GUILDS.map((guild) => ({
    slug: slugify(guild.name),
    name: guild.name,
    type: guild.type,
    description: guild.description,
    mission: guild.mission,
    language: guild.language,
    headquarters: guild.headquarters,
    recruitmentPitch: guild.recruitmentPitch,
    color: TYPE_COLORS[guild.type],
    rank: guild.rank,
    level: guild.level,
    xp: guild.xp,
    xpNext: guild.xpNext,
    weeklyXP: guild.weeklyXP,
    winRate: guild.winRate,
    memberCount: guild.members,
    maxMembers: guild.maxMembers,
    founded: guild.founded,
    openToJoin: guild.openToJoin,
    featured: Boolean(guild.featured),
    tags: guild.tags,
    requirements: TYPE_REQUIREMENTS[guild.type],
    perks: TYPE_PERKS[guild.type],
    quests: guild.quests,
    questClaims: [],
    activityFeed: makeActivityFeed(guild),
    featuredMembers: makeFeaturedMembers(guild.initials, guild.name),
    memberIds: [],
    ownerId: undefined,
  }));
}
