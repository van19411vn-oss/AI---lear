import { Subject, Difficulty, QuestionType } from './index';

export type CurriculumVolume = 1 | 2;

export type MathActivityType =
  | 'review' // 1. Ôn kiến thức
  | 'basic' // 2. Bài tập cơ bản
  | 'reinforce' // 3. Bài tập củng cố
  | 'apply' // 4. Bài tập vận dụng
  | 'game' // 5. Trò chơi học tập
  | 'advanced'; // 6. Thử thách nâng cao

export type VietActivityType =
  | 'reading' // 1. Đọc hiểu bài đọc
  | 'comprehension' // 2. Trả lời câu hỏi theo nội dung
  | 'vocabulary' // 3. Mở rộng vốn từ
  | 'sentence_types' // 4. Nhận biết từ ngữ & kiểu câu (Ai là gì? Ai làm gì? Ai thế nào?)
  | 'spelling' // 5. Chính tả (ch/tr, s/x, l/n, c/k, g/gh, ng/ngh, ...)
  | 'word_order' // 6. Sắp xếp từ thành câu
  | 'sentence_order' // 7. Sắp xếp câu thành đoạn
  | 'writing' // 8. Luyện viết câu / đoạn văn ngắn
  | 'speaking_listening'; // 9. Nói và nghe

export type LessonActivityType = MathActivityType | VietActivityType;

export interface CurriculumTheme {
  id: string;
  subject: Subject;
  volume: CurriculumVolume;
  themeNumber: number;
  title: string;
  description: string;
  icon: string;
}

export interface ReadingPassage {
  title: string;
  authorOrNotice: string;
  content: string;
  audioPrompt?: string;
  isAiGenerated: boolean;
}

export interface CurriculumQuestion {
  id: string;
  activityType: LessonActivityType;
  type: QuestionType; // 'multiple_choice' | 'fill_in_blank' | 'short_answer'
  question: string;
  visualIllustration?: string;
  options?: string[];
  correctAnswer: string;
  acceptableAnswers?: string[];
  wordScramble?: string[]; // for word ordering
  sentenceScramble?: string[]; // for sentence ordering
  maxCharacters?: number;
  sampleAnswer?: string;
  points: number;
  hint: string;
  explanation: string;
  mathCalculationCheck?: {
    operandA: number;
    operator: '+' | '-' | '*' | '/';
    operandB: number;
    expectedResult: number;
  };
}

export interface CurriculumLesson {
  id: string;
  subject: Subject;
  volume: CurriculumVolume;
  themeId: string;
  themeName: string;
  lessonNumber: number;
  title: string; // Exact title from SGK Kết nối tri thức lớp 2
  learningGoals: string[]; // Mục tiêu kiến thức
  skills: string[]; // Kỹ năng cần rèn luyện
  suitableQuestionTypes: QuestionType[];
  difficulty: Difficulty;
  isVerified: boolean; // True if verified from official textbook TOC
  mathActivities?: MathActivityType[];
  vietnameseActivities?: VietActivityType[];
  readingPassage?: ReadingPassage;
  knowledgeReviewCards: {
    title: string;
    content: string;
    highlightRule?: string;
    icon?: string;
  }[];
  defaultQuestions: CurriculumQuestion[];
}

export interface AssignedHomework {
  id: string;
  lessonId: string;
  lessonTitle: string;
  subject: Subject;
  volume: CurriculumVolume;
  assignedDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  classCode?: string; // e.g. "2A10"
  classId?: string;
  level: 'basic' | 'reinforce' | 'advanced';
  targetType: 'all' | 'need_support' | 'custom';
  targetStudentIds: string[]; // empty if 'all'
  noteFromTeacher: string;
  submissions: {
    studentId: string;
    studentName: string;
    studentAvatar: string;
    completedAt: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
    isGraded: boolean;
    teacherRemark?: string;
  }[];
}

export interface StudentLessonResult {
  id: string;
  studentId: string;
  studentCode: string;
  lessonId: string;
  lessonTitle: string;
  subject: Subject;
  volume: CurriculumVolume;
  activityType: LessonActivityType;
  activityName: string;
  date: string;
  completedAt: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  score: number;
  pointsAwarded: number;
  starsAwarded: number;
  commonWrongTopics?: string[];
}
