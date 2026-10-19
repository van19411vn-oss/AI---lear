export type UserRole = 'student' | 'teacher';

export type BadgeCategory = 'academic' | 'diligence' | 'activity';

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: string;
  color: string;
  targetCount: number;
  currentCount?: number;
  unit: string;
  requirementLabel: string;
  unlockedAt?: string;
  isUnlocked?: boolean;
}

export interface ProgressSummary {
  completedLessons: number;
  accuracy: number;
  totalQuestions: number;
  correctAnswers: number;
}

export interface DetailedStudyRecord {
  id: string;
  date: string; // YYYY-MM-DD
  subject: Subject;
  topicName: string;
  totalQuestions: number;
  correctCount: number;
  score: number;
  incorrectTopics: string[];
}

export interface StudentDuelRecord {
  matchId: string;
  roomCode: string;
  title: string;
  subject: Subject;
  opponentName: string;
  opponentAvatar: string;
  myScore: number;
  opponentScore: number;
  result: 'win' | 'loss' | 'tie';
  date: string;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  pointsEarned: number;
  lessonsDone: number;
}

export type AccountStatus = 'active' | 'locked' | 'unregistered';

export interface Student {
  id: string;
  studentCode: string;
  username?: string; // e.g. "2a10_minhanh" (unique across system)
  name: string;
  classCode: string;
  classId?: string;
  pin: string; // PIN for display or backward-compatibility
  passwordHash?: string; // SHA-256 password hash (never stored plain)
  hasAccount?: boolean; // Whether credentials have been provisioned
  accountStatus?: AccountStatus;
  accountCreatedAt?: string;
  lastPasswordResetAt?: string;
  initialPasswordPlain?: string; // Temporary memory-only plain password for one-time teacher export
  avatar: string;
  birthday?: string; // e.g. "15/08/2018"
  gender?: 'Nam' | 'Nữ';
  totalPoints: number;
  totalStars: number;
  streakDays: number;
  mathProgress: ProgressSummary;
  vietnameseProgress: ProgressSummary;
  badges: Badge[];
  history: DailyActivity[];
  detailedStudyHistory?: DetailedStudyRecord[];
  duelRecords?: StudentDuelRecord[];
  commonMistakes?: string[];
  teacherNotes: string;
  lastActiveDate: string;
  isLocked?: boolean;
  lockedReason?: string;
}

export interface BatchAccountItem {
  stt: number;
  studentId: string;
  name: string;
  studentCode: string;
  classCode: string;
  username: string;
  initialPassword?: string;
  status: 'created' | 'already_exists' | 'error';
  errorMessage?: string;
}

export interface BatchAccountResult {
  totalRequested: number;
  newlyCreatedCount: number;
  alreadyExistedCount: number;
  failedCount: number;
  items: BatchAccountItem[];
}

export interface ClassRoom {
  id: string;
  classCode: string; // e.g. "2A10", "2A1", "2A2"
  name: string; // e.g. "Lớp 2A10", "Lớp 2A1"
  grade: number; // 2
  academicYear: string; // "2024 - 2025"
  teacherId: string; // ID of the teacher in charge
  schoolName?: string;
  description?: string;
  studentCount?: number;
}

export interface Teacher {
  id: string;
  name: string;
  roleTitle: string;
  avatar: string;
  email: string;
  password?: string;
  schoolName: string;
  phone?: string;
  managedClassIds: string[];
  activeClassId: string;
  classCode?: string; // backward compat
}

export type Subject = 'math' | 'vietnamese';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'multiple_choice' | 'fill_in_blank' | 'short_answer';

export interface Topic {
  id: string;
  subject: Subject;
  name: string;
  grade: number;
  icon: string;
  description: string;
  questionCount: number;
  badgeReward: string;
}

export interface Question {
  id: string;
  type: QuestionType; // 'multiple_choice' | 'fill_in_blank' | 'short_answer'
  subject: Subject;
  topicId: string;
  topicName: string;
  difficulty: Difficulty;
  question: string;
  visualIllustration?: string; // e.g. "🍎🍎🍎 + 🍎🍎 = ?"
  options?: string[]; // for multiple_choice
  correctAnswer?: string; // for multiple_choice and primary fill_in_blank
  acceptableAnswers?: string[]; // for fill_in_blank auto-grading variants (e.g. ['ch', 'CH'])
  maxCharacters?: number; // for short_answer (e.g. 120 chars)
  sampleAnswer?: string; // sample answer for teacher reference
  points: number; // default e.g. 10 points
  hint: string;
  explanation: string;
  isApprovedByTeacher: boolean;
  createdAt?: string;
  source?: 'system' | 'ai_generated' | 'teacher_custom';
}

export interface ExamSubmissionAnswer {
  questionId: string;
  questionType: QuestionType;
  studentAnswer: string;
  isCorrect?: boolean; // for auto-graded questions
  awardedScore: number;
  maxScore: number;
  teacherComment?: string;
}

export interface ExamSubmission {
  id: string;
  matchId: string;
  roomCode: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  submittedAt: string;
  answers: ExamSubmissionAnswer[];
  autoScore: number;
  manualScore: number;
  totalScore: number;
  maxPossibleScore: number;
  isGradedByTeacher: boolean;
  teacherGeneralFeedback?: string;
}

export type ChallengeType = 'direct' | 'asynchronous' | 'class_room';
export type ChallengeStatus = 'waiting' | 'in_progress' | 'completed';

export interface ChallengeMatch {
  id: string;
  roomCode: string;
  type: ChallengeType;
  title: string;
  classCode: string;
  subject: Subject;
  status: ChallengeStatus;
  hostStudentId: string;
  hostStudentName: string;
  hostAvatar: string;
  hostScore: number;
  hostProgress: number; // 0 to questions.length
  opponentStudentId?: string;
  opponentStudentName?: string;
  opponentAvatar?: string;
  opponentScore: number;
  opponentProgress: number;
  questions: Question[];
  totalQuestions: number;
  timePerQuestion: number; // in seconds
  expiresAt: string;
  winnerId?: string | 'tie';
  allowedQuestionTypes?: QuestionType[];
  submissions?: ExamSubmission[];
  hasManualGrading?: boolean;
}

export interface LeaderboardItem {
  id: string;
  studentCode: string;
  name: string;
  avatar: string;
  classCode: string;
  points: number;
  stars: number;
  accuracy: number;
  streakDays: number;
  rank: number;
  badgeCount: number;
  recentGrowthPoints: number; // Points gained this week
}

export interface ClassRoomMistakeStat {
  topic: string;
  subject: Subject;
  mistakeRate: number; // percentage
  commonIssue: string;
  suggestedAction: string;
}
