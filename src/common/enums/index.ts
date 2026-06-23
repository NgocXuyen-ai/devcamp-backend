export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum CareerField {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  FULLSTACK = 'fullstack',
}

export enum SkillLevel {
  NOVICE = 'novice',
  APPRENTICE = 'apprentice',
  JOURNEYMAN = 'journeyman',
  MASTER = 'master',
}

export enum LessonLevel {
  ROOT = 'root',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum NodeStatus {
  LOCKED = 'locked',
  OPEN = 'open',
  CURRENT = 'current',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  TEMP_LOCKED = 'temp_locked', // Locked due to too many wrong submissions
}

export enum NodeType {
  LESSON = 'lesson',
  ASSIGNMENT = 'assignment',
  LAB = 'lab',
  MINI_PROJECT = 'mini_project',
  QUIZ = 'quiz',
  MILESTONE_GATE = 'milestone_gate',
}

export enum QuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXTREME = 'extreme',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  CODING = 'coding',
  LAB = 'lab',
  MINI_PROJECT = 'mini_project',
}

export enum SubmissionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  WRONG_ANSWER = 'wrong_answer',
  COMPILATION_ERROR = 'compilation_error',
  RUNTIME_ERROR = 'runtime_error',
  TIME_LIMIT_EXCEEDED = 'time_limit_exceeded',
  MEMORY_LIMIT_EXCEEDED = 'memory_limit_exceeded',
}

export enum BattleMode {
  PERFORMANCE = 'performance',
  SPEED = 'speed',
}

export enum BattleStatus {
  WAITING = 'waiting',
  MATCHED = 'matched',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
  CANCELLED = 'cancelled',
}

export enum BattleResult {
  VICTORY = 'victory',
  DEFEAT = 'defeat',
  DRAW = 'draw',
}

export enum AIMessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

export enum AIMentorStyle {
  INDIRECT = 'indirect', // Chỉ đặt câu hỏi gợi mở
  STEP_BY_STEP = 'step_by_step', // Tiết lộ hint nhỏ dần
  CONCEPT_EXPLANATION = 'concept_explanation', // Giải thích khái niệm
  DIRECT = 'direct', // Cho code mẫu
}

export enum AIMentorTone {
  STRICT = 'strict', // Nghiêm túc, ngắn gọn
  FRIENDLY = 'friendly', // Thân thiện như bạn học
  ENCOURAGING = 'encouraging', // Khích lệ
  CUSTOM = 'custom',
}

export enum NotificationType {
  STREAK_REMINDER = 'streak_reminder',
  STREAK_BROKEN = 'streak_broken',
  LESSON_UNLOCK = 'lesson_unlock',
  PENALTY_APPLIED = 'penalty_applied',
  BATTLE_INVITE = 'battle_invite',
  BATTLE_RESULT = 'battle_result',
  ACHIEVEMENT = 'achievement',
  RECALL_DUE = 'recall_due',
  SUSPICIOUS_LOGIN = 'suspicious_login',
  SYSTEM = 'system',
}

export enum PenaltyType {
  COOLDOWN = 'cooldown', // Phải đợi
  LOCKED = 'locked', // Bài khóa hoàn toàn
  ELO_DEDUCTION = 'elo_deduction', // Trừ ELO
  ESCALATING = 'escalating', // Tăng dần
}

export enum DisciplineLevel {
  LIGHT = 'light', // A. Nhẹ nhàng (Chỉ nhắc nhở)
  STRICT = 'strict', // B. Nghiêm khắc
}

export enum LoginProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  GITHUB = 'github',
}

export enum LoginAttemptResult {
  SUCCESS = 'success',
  WRONG_PASSWORD = 'wrong_password',
  ACCOUNT_LOCKED = 'account_locked',
  CAPTCHA_REQUIRED = 'captcha_required',
  USER_NOT_FOUND = 'user_not_found',
}

export enum OtpPurpose {
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
}

export enum HistoryAction {
  LESSON_COMPLETED = 'lesson_completed',
  LESSON_FAILED = 'lesson_failed',
  LESSON_LOCKED = 'lesson_locked',
  RECALL_PASSED = 'recall_passed',
  RECALL_FAILED = 'recall_failed',
  BATTLE_WON = 'battle_won',
  BATTLE_LOST = 'battle_lost',
  SUBMISSION_MADE = 'submission_made',
}

export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}
