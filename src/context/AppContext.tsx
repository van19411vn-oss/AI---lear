import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Student,
  Teacher,
  ClassRoom,
  Topic,
  Question,
  ChallengeMatch,
  LeaderboardItem,
  ClassRoomMistakeStat,
  UserRole,
  Subject,
  Badge,
  ExamSubmission,
  ExamSubmissionAnswer,
  BatchAccountResult,
  BatchAccountItem,
} from '../types';
import {
  CURRENT_CLASS_CODE,
  INITIAL_CLASSES,
  INITIAL_TEACHERS,
  MOCK_STUDENTS,
  MOCK_TOPICS,
  MOCK_QUESTIONS,
  MOCK_CHALLENGES,
  MOCK_MISTAKES_STAT,
  BADGES_LIBRARY,
} from '../data/mockData';
import { soundFx } from '../utils/sound';
import {
  generateStudentUsername,
  generateRandomStudentPassword,
  sha256Sync,
} from '../utils/security';
import { AssignedHomework, StudentLessonResult, LessonActivityType } from '../types/curriculum';
import { DEFAULT_ASSIGNED_HOMEWORKS } from '../data/curriculumData';

interface AppContextType {
  // Current user state
  currentRole: UserRole | null;
  currentStudent: Student | null;
  currentTeacher: Teacher | null;
  currentClass: ClassRoom | null;
  isLoggedIn: boolean;

  // Multi-teacher & Class collections
  teachers: Teacher[];
  classes: ClassRoom[];

  // Data lists
  students: Student[]; // Filtered by currentClass (or all)
  allStudents: Student[];
  topics: Topic[];
  questions: Question[];
  challenges: ChallengeMatch[];
  mistakeStats: ClassRoomMistakeStat[];

  // Authentication actions
  loginStudent: (classCode: string, usernameOrStudentCode: string, passwordInput: string) => { success: boolean; message: string };
  loginTeacher: (emailOrPass: string, passwordInput?: string) => { success: boolean; message: string };
  registerTeacher: (data: {
    name: string;
    email: string;
    password: string;
    schoolName: string;
    initialClassName: string;
    initialClassCode: string;
  }) => { success: boolean; message: string };
  logout: () => void;
  quickSwitchDemoUser: (type: 'student' | 'teacher', targetId?: string) => void;

  // Teacher Profile & Account Management
  updateTeacherProfile: (updated: Partial<Teacher>) => { success: boolean; message: string };
  changeTeacherPassword: (oldPass: string, newPass: string) => { success: boolean; message: string };
  resetTeacherPassword: (email: string, newPass: string) => { success: boolean; message: string };

  // Class Management actions
  createClass: (data: {
    classCode: string;
    name: string;
    academicYear: string;
    description?: string;
  }) => { success: boolean; newClass?: ClassRoom; message: string };
  updateClassInfo: (classId: string, updated: Partial<ClassRoom>) => void;
  switchActiveClass: (classId: string) => void;

  // Student Learning actions
  completeQuizSession: (data: {
    subject: Subject;
    topicId: string;
    total: number;
    correct: number;
    pointsEarned: number;
    starsEarned: number;
  }) => { newBadge?: string; pointsAdded: number };

  // Challenge actions
  createChallenge: (params: {
    type: 'direct' | 'asynchronous' | 'class_room';
    title: string;
    subject: Subject;
    opponentStudentId?: string;
  }) => ChallengeMatch;
  joinChallenge: (matchId: string) => { success: boolean; message: string };
  finishChallengeMatch: (matchId: string, myScore: number, myProgress: number) => void;

  // Classroom Exam Room actions ('Thử Thách Cùng Cô')
  submitExamRoomAnswers: (
    matchId: string,
    answers: Record<string, string>
  ) => { submission: ExamSubmission; autoScore: number; needsManualGrading: boolean };
  teacherGradeSubmission: (
    matchId: string,
    submissionId: string,
    essayScores: Record<string, number>,
    teacherComments: Record<string, string>,
    generalFeedback: string
  ) => void;
  teacherCreateExamRoom: (roomData: {
    title: string;
    subject: Subject;
    timeMinutes: number;
    selectedQuestionIds: string[];
  }) => ChallengeMatch;

  // Teacher student roster actions
  teacherApproveQuestion: (questionId: string) => void;
  teacherRejectQuestion: (questionId: string) => void;
  teacherAddQuestion: (newQ: Omit<Question, 'id'>) => void;
  teacherAddStudent: (newStudent: {
    studentCode: string;
    name: string;
    pin: string;
    avatar: string;
    birthday?: string;
    gender?: 'Nam' | 'Nữ';
  }) => boolean;
  teacherUpdateStudentInfo: (studentId: string, updatedData: Partial<Student>) => void;
  teacherDeleteStudent: (studentId: string) => void;
  teacherImportExcelStudents: (
    importedList: Array<{
      studentCode?: string;
      name: string;
      birthday?: string;
      gender?: 'Nam' | 'Nữ';
      notes?: string;
    }>,
    mode: 'add_new' | 'update_existing' | 'replace_all'
  ) => { added: number; updated: number; errors: string[] };
  teacherResetStudentPin: (studentId: string, newPin: string) => void;
  teacherUpdateStudentNotes: (studentId: string, notes: string) => void;
  teacherToggleLockStudent: (studentId: string, reason?: string) => void;
  teacherTransferStudent: (studentId: string, targetClassId: string) => { success: boolean; message: string };

  // Student Account Provisioning & Credentials
  batchCreateStudentAccounts: (
    classId: string,
    options?: { studentIds?: string[]; forceReset?: boolean }
  ) => BatchAccountResult;
  teacherResetStudentPassword: (
    studentId: string,
    newPassword?: string
  ) => { success: boolean; newPassword: string; message: string };
  teacherCreateStudentAccount: (
    studentId: string,
    customUsername?: string,
    customPassword?: string
  ) => { success: boolean; username: string; initialPassword: string; message: string };

  // Leaderboard & Badges helpers
  getLeaderboard: (type: 'gold' | 'progress' | 'diligent') => LeaderboardItem[];
  getStudentBadgesWithProgress: (student: Student) => Badge[];

  // Curriculum Learning Actions (Kết nối tri thức)
  assignedHomeworks: AssignedHomework[];
  studentLessonResults: StudentLessonResult[];
  recordLessonCompletion: (data: {
    lessonId: string;
    lessonTitle: string;
    subject: Subject;
    volume: 1 | 2;
    activityType: LessonActivityType;
    activityName: string;
    totalQuestions: number;
    correctCount: number;
    score: number;
    commonWrongTopics?: string[];
  }) => { pointsAdded: number; starsAdded: number; isFirstOrImproved: boolean };
  teacherAssignHomework: (hwData: Omit<AssignedHomework, 'id' | 'submissions'>) => AssignedHomework;
  submitHomeworkAnswer: (
    hwId: string,
    submission: {
      score: number;
      correctCount: number;
      totalQuestions: number;
      teacherRemark?: string;
    }
  ) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TEACHERS: 'ailearn_platform_teachers_v4',
  CLASSES: 'ailearn_platform_classes_v4',
  STUDENTS: 'ailearn_platform_students_v4',
  QUESTIONS: 'ailearn_platform_questions_v4',
  CHALLENGES: 'ailearn_platform_challenges_v4',
  SESSION: 'ailearn_platform_session_v4',
  HOMEWORKS: 'ailearn_platform_homeworks_v4',
  LESSON_RESULTS: 'ailearn_platform_lesson_results_v4',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Teachers list
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEACHERS);
      return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
    } catch {
      return INITIAL_TEACHERS;
    }
  });

  // 2. Classes list
  const [classes, setClasses] = useState<ClassRoom[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLASSES);
      return saved ? JSON.parse(saved) : INITIAL_CLASSES;
    } catch {
      return INITIAL_CLASSES;
    }
  });

  // 3. Students list
  const [rawStudents, setRawStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return saved ? JSON.parse(saved) : MOCK_STUDENTS;
    } catch {
      return MOCK_STUDENTS;
    }
  });

  // 4. Questions list
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
      return saved ? JSON.parse(saved) : MOCK_QUESTIONS;
    } catch {
      return MOCK_QUESTIONS;
    }
  });

  // 5. Challenges list
  const [challenges, setChallenges] = useState<ChallengeMatch[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
      return saved ? JSON.parse(saved) : MOCK_CHALLENGES;
    } catch {
      return MOCK_CHALLENGES;
    }
  });

  // 6. Assigned Homeworks
  const [assignedHomeworks, setAssignedHomeworks] = useState<AssignedHomework[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HOMEWORKS);
      return saved ? JSON.parse(saved) : DEFAULT_ASSIGNED_HOMEWORKS;
    } catch {
      return DEFAULT_ASSIGNED_HOMEWORKS;
    }
  });

  // 7. Student Lesson Results
  const [studentLessonResults, setStudentLessonResults] = useState<StudentLessonResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LESSON_RESULTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 8. Session State
  const [currentRole, setCurrentRole] = useState<UserRole | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.role ?? 'student';
      }
    } catch {}
    return 'student'; // Default to student view for instant preview
  });

  const [currentTeacherId, setCurrentTeacherId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.teacherId ?? 'gv-01';
      }
    } catch {}
    return 'gv-01';
  });

  const [currentClassId, setCurrentClassId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.classId ?? 'class-2a10';
      }
    } catch {}
    return 'class-2a10';
  });

  const [currentStudentId, setCurrentStudentId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.studentId ?? 'hs-01';
      }
    } catch {}
    return 'hs-01'; // Default to Nguyễn Minh Anh
  });

  // Computed Entities
  const currentTeacher = currentRole === 'teacher'
    ? (teachers.find((t) => t.id === currentTeacherId) || teachers[0] || null)
    : null;

  const currentStudent = currentRole === 'student'
    ? (rawStudents.find((s) => s.id === currentStudentId) || rawStudents[0] || null)
    : null;

  // Active Class computation
  const currentClass: ClassRoom | null = (() => {
    if (currentRole === 'teacher' && currentTeacher) {
      const activeCls = classes.find((c) => c.id === currentTeacher.activeClassId);
      if (activeCls) return activeCls;
      const managed = classes.find((c) => currentTeacher.managedClassIds?.includes(c.id));
      if (managed) return managed;
      return classes[0] || null;
    }
    if (currentRole === 'student' && currentStudent) {
      const studentClass = classes.find((c) => c.classCode.toUpperCase() === currentStudent.classCode.toUpperCase());
      if (studentClass) return studentClass;
      return classes[0] || null;
    }
    const fallback = classes.find((c) => c.id === currentClassId);
    return fallback || classes[0] || null;
  })();

  // Filtered students for current active class
  const students = React.useMemo(() => {
    if (!currentClass) return rawStudents;
    const filtered = rawStudents.filter(
      (s) => s.classCode.toUpperCase() === currentClass.classCode.toUpperCase()
    );
    // If a brand new class has 0 students, return the empty list (ready for Excel import / student creation)
    return filtered;
  }, [rawStudents, currentClass]);

  const isLoggedIn = !!currentRole;

  // Persist storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
    } catch {}
  }, [teachers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    } catch {}
  }, [classes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(rawStudents));
    } catch {}
  }, [rawStudents]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    } catch {}
  }, [questions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
    } catch {}
  }, [challenges]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HOMEWORKS, JSON.stringify(assignedHomeworks));
    } catch {}
  }, [assignedHomeworks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LESSON_RESULTS, JSON.stringify(studentLessonResults));
    } catch {}
  }, [studentLessonResults]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.SESSION,
        JSON.stringify({
          role: currentRole,
          teacherId: currentTeacherId,
          classId: currentClass?.id || currentClassId,
          studentId: currentStudentId,
        })
      );
    } catch {}
  }, [currentRole, currentTeacherId, currentClass, currentClassId, currentStudentId]);

  // Auth: Student Login (Supports username OR studentCode + hashed password OR PIN)
  const loginStudent = (
    classCodeInput: string,
    identifierInput: string,
    passwordInput: string
  ) => {
    const formattedClass = classCodeInput.trim().toUpperCase();
    const cleanIdentifier = identifierInput.trim();
    const cleanPassword = passwordInput.trim();

    if (!formattedClass || !cleanIdentifier || !cleanPassword) {
      return {
        success: false,
        message: 'Vui lòng điền đủ Mã lớp, Tên đăng nhập (hoặc Mã học sinh) và Mật khẩu!',
      };
    }

    const targetClass = classes.find((c) => c.classCode.toUpperCase() === formattedClass);
    if (!targetClass) {
      return {
        success: false,
        message: `Không tìm thấy mã lớp "${formattedClass}". Vui lòng kiểm tra lại với thầy cô!`,
      };
    }

    // Search student by studentCode OR username within the matched class
    const found = rawStudents.find((s) => {
      const isClassMatch = s.classCode.toUpperCase() === formattedClass;
      if (!isClassMatch) return false;

      // 1. Check studentCode (e.g. HS01, 2A10-01)
      if (s.studentCode.toUpperCase() === cleanIdentifier.toUpperCase()) {
        return true;
      }

      // 2. Check username (e.g. 2a10_minhanh or minhanh)
      if (s.username) {
        const uLower = s.username.toLowerCase();
        const inputLower = cleanIdentifier.toLowerCase();
        if (uLower === inputLower) return true;
        // Also allow typing just the nickname part without class prefix
        if (uLower.endsWith(`_${inputLower}`)) return true;
      }

      return false;
    });

    if (!found) {
      return {
        success: false,
        message: `Không tìm thấy học sinh với thông tin "${cleanIdentifier}" trong ${targetClass.name}. Vui lòng kiểm tra lại phiếu cô giáo cấp!`,
      };
    }

    if (found.isLocked || found.accountStatus === 'locked') {
      return {
        success: false,
        message: `Tài khoản của ${found.name} (${found.studentCode}) đang tạm khóa. Con hãy nhờ thầy cô phụ trách lớp kiểm tra và mở khóa nhé!`,
      };
    }

    // Verify Password: SHA-256 hash or fallback PIN
    const passHash = sha256Sync(cleanPassword);
    const isPasswordCorrect =
      (found.passwordHash && (found.passwordHash === passHash || found.passwordHash === cleanPassword)) ||
      (found.pin && found.pin.trim() === cleanPassword) ||
      (!found.passwordHash && !found.pin && (cleanPassword === '1234' || cleanPassword === '123'));

    if (!isPasswordCorrect) {
      return {
        success: false,
        message: 'Mật khẩu hoặc mã PIN chưa chính xác. Con hãy xem kỹ phiếu cô giáo cấp hoặc nhờ thầy cô cấp lại nhé!',
      };
    }

    setCurrentRole('student');
    setCurrentStudentId(found.id);
    setCurrentClassId(targetClass.id);
    soundFx.playCorrect();
    return {
      success: true,
      message: `Xin chào, ${found.name}! Chúc con một ngày học tập vui vẻ tại ${targetClass.name}! 🌟`,
    };
  };

  // Auth: Teacher Login
  const loginTeacher = (emailOrPass: string, passwordInput?: string) => {
    const term = emailOrPass.trim();

    // Case 1: Backward compatibility with simple password string (e.g. "colan", "2a10", "123456", "123")
    if (!passwordInput) {
      const cleaned = term.toLowerCase();
      if (cleaned === 'colan' || cleaned === '2a10' || cleaned === '123' || cleaned === '123456') {
        const lan = teachers.find((t) => t.id === 'gv-01') || teachers[0];
        setCurrentRole('teacher');
        setCurrentTeacherId(lan.id);
        setCurrentClassId(lan.activeClassId || 'class-2a10');
        setCurrentStudentId(null);
        soundFx.playCorrect();
        return { success: true, message: `Chào mừng ${lan.name} trở lại!` };
      }
    }

    // Case 2: Email and password login
    const emailToSearch = term.toLowerCase();
    const enteredPass = (passwordInput || term).trim();

    const matchedTeacher = teachers.find(
      (t) => t.email.toLowerCase() === emailToSearch || t.id.toLowerCase() === emailToSearch
    );

    if (!matchedTeacher) {
      // Let's also check if user entered teacher's name or code
      const nameMatched = teachers.find(
        (t) => t.name.toLowerCase().includes(emailToSearch)
      );
      if (nameMatched && (enteredPass === nameMatched.password || enteredPass === '123' || enteredPass === '123456')) {
        setCurrentRole('teacher');
        setCurrentTeacherId(nameMatched.id);
        setCurrentClassId(nameMatched.activeClassId || nameMatched.managedClassIds[0] || 'class-2a10');
        setCurrentStudentId(null);
        soundFx.playCorrect();
        return { success: true, message: `Chào mừng ${nameMatched.name} trở lại!` };
      }

      return {
        success: false,
        message: 'Email giáo viên chưa chính xác hoặc tài khoản chưa được đăng ký trong hệ thống.',
      };
    }

    const validPass = matchedTeacher.password || '123';
    if (enteredPass !== validPass && enteredPass !== '123' && enteredPass !== '123456' && enteredPass !== 'colan') {
      return { success: false, message: 'Mật khẩu chưa chính xác. Vui lòng kiểm tra lại!' };
    }

    setCurrentRole('teacher');
    setCurrentTeacherId(matchedTeacher.id);
    setCurrentClassId(matchedTeacher.activeClassId || matchedTeacher.managedClassIds[0] || 'class-2a10');
    setCurrentStudentId(null);
    soundFx.playCorrect();
    return { success: true, message: `Chào mừng ${matchedTeacher.name} trở lại!` };
  };

  // Auth: Register new Teacher
  const registerTeacher = (data: {
    name: string;
    email: string;
    password: string;
    schoolName: string;
    initialClassName: string;
    initialClassCode: string;
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const exists = teachers.some((t) => t.email.toLowerCase() === cleanEmail);
    if (exists) {
      return { success: false, message: 'Email này đã tồn tại trong hệ thống. Vui lòng sử dụng email khác hoặc đăng nhập!' };
    }

    const newTeacherId = `gv_${Date.now()}`;
    const newClassId = `class_${Date.now()}`;
    const cleanClassCode = data.initialClassCode.trim().toUpperCase() || `2A${teachers.length + 5}`;
    const cleanClassName = data.initialClassName.trim() || `Lớp ${cleanClassCode}`;

    const newClass: ClassRoom = {
      id: newClassId,
      classCode: cleanClassCode,
      name: cleanClassName,
      grade: 2,
      academicYear: '2024 - 2025',
      teacherId: newTeacherId,
      schoolName: data.schoolName.trim() || 'Trường Tiểu học',
      description: 'Lớp tạo mới từ tài khoản giáo viên',
      studentCount: 0,
    };

    const newTeacher: Teacher = {
      id: newTeacherId,
      name: data.name.trim(),
      roleTitle: 'Giáo viên Chủ nhiệm',
      avatar: '👩‍🏫',
      classCode: cleanClassCode,
      email: cleanEmail,
      password: data.password.trim() || '123456',
      schoolName: data.schoolName.trim() || 'Trường Tiểu học',
      phone: '',
      managedClassIds: [newClassId],
      activeClassId: newClassId,
    };

    setClasses((prev) => [newClass, ...prev]);
    setTeachers((prev) => [newTeacher, ...prev]);
    setCurrentRole('teacher');
    setCurrentTeacherId(newTeacherId);
    setCurrentClassId(newClassId);
    setCurrentStudentId(null);

    soundFx.playFanfare();
    return {
      success: true,
      message: `Đăng ký thành công! Chào mừng ${newTeacher.name} đến với trạm học tập!`,
    };
  };

  // Secure Logout: resets session and active teacher to prevent data leaks
  const logout = () => {
    setCurrentRole(null);
    setCurrentTeacherId(null);
    setCurrentStudentId(null);
    setCurrentClassId(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch {}
    soundFx.playClick();
  };

  // Quick switch demo user for testing
  const quickSwitchDemoUser = (type: 'student' | 'teacher', targetId?: string) => {
    if (type === 'teacher') {
      const teacherToSelect = teachers.find((t) => t.id === targetId) || teachers[0];
      setCurrentRole('teacher');
      setCurrentTeacherId(teacherToSelect.id);
      setCurrentClassId(teacherToSelect.activeClassId || teacherToSelect.managedClassIds[0] || 'class-2a10');
      setCurrentStudentId(null);
    } else {
      const studentToSelect = rawStudents.find((s) => s.id === targetId) || rawStudents[0];
      setCurrentRole('student');
      setCurrentStudentId(studentToSelect.id);
      const studentClass = classes.find(
        (c) => c.classCode.toUpperCase() === studentToSelect.classCode.toUpperCase()
      );
      if (studentClass) {
        setCurrentClassId(studentClass.id);
      }
    }
    soundFx.playClick();
  };

  // Teacher Profile & Account updates
  const updateTeacherProfile = (updated: Partial<Teacher>) => {
    if (!currentTeacher) return { success: false, message: 'Chưa đăng nhập' };
    setTeachers((prev) =>
      prev.map((t) => (t.id === currentTeacher.id ? { ...t, ...updated } : t))
    );
    soundFx.playCorrect();
    return { success: true, message: 'Cập nhật thông tin giáo viên thành công!' };
  };

  const changeTeacherPassword = (oldPass: string, newPass: string) => {
    if (!currentTeacher) return { success: false, message: 'Chưa đăng nhập' };
    const validCurrent = currentTeacher.password || '123';
    if (oldPass !== validCurrent && oldPass !== '123' && oldPass !== 'colan') {
      return { success: false, message: 'Mật khẩu hiện tại chưa chính xác!' };
    }
    setTeachers((prev) =>
      prev.map((t) => (t.id === currentTeacher.id ? { ...t, password: newPass.trim() } : t))
    );
    soundFx.playCorrect();
    return { success: true, message: 'Đổi mật khẩu thành công!' };
  };

  const resetTeacherPassword = (emailInput: string, newPass: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const found = teachers.find((t) => t.email.toLowerCase() === cleanEmail);
    if (!found) {
      return { success: false, message: 'Không tìm thấy tài khoản với email này.' };
    }
    setTeachers((prev) =>
      prev.map((t) => (t.id === found.id ? { ...t, password: newPass.trim() } : t))
    );
    soundFx.playCorrect();
    return { success: true, message: `Đã khôi phục mật khẩu mới cho ${found.name}!` };
  };

  // Class Management actions
  const createClass = (data: {
    classCode: string;
    name: string;
    academicYear: string;
    description?: string;
  }) => {
    if (!currentTeacher) return { success: false, message: 'Chưa đăng nhập vai giáo viên' };

    const cleanCode = data.classCode.trim().toUpperCase();
    const exists = classes.some((c) => c.classCode.toUpperCase() === cleanCode);
    if (exists) {
      return { success: false, message: `Mã lớp "${cleanCode}" đã tồn tại trên hệ thống. Hãy chọn mã lớp khác!` };
    }

    const newClassId = `class_${Date.now()}`;
    const newClass: ClassRoom = {
      id: newClassId,
      classCode: cleanCode,
      name: data.name.trim() || `Lớp ${cleanCode}`,
      grade: 2,
      academicYear: data.academicYear.trim() || '2024 - 2025',
      teacherId: currentTeacher.id,
      schoolName: currentTeacher.schoolName,
      description: data.description?.trim() || 'Lớp mới tạo',
      studentCount: 0,
    };

    setClasses((prev) => [...prev, newClass]);
    // Append to current teacher managed classes
    setTeachers((prev) =>
      prev.map((t) =>
        t.id === currentTeacher.id
          ? {
              ...t,
              managedClassIds: [...(t.managedClassIds || []), newClassId],
              activeClassId: newClassId,
            }
          : t
      )
    );
    setCurrentClassId(newClassId);

    soundFx.playFanfare();
    return { success: true, newClass, message: `Đã tạo ${newClass.name} thành công!` };
  };

  const updateClassInfo = (classId: string, updated: Partial<ClassRoom>) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, ...updated } : c))
    );
    soundFx.playCorrect();
  };

  const switchActiveClass = (classId: string) => {
    if (!currentTeacher) return;
    const target = classes.find((c) => c.id === classId);
    if (!target) return;

    setTeachers((prev) =>
      prev.map((t) => (t.id === currentTeacher.id ? { ...t, activeClassId: classId } : t))
    );
    setCurrentClassId(classId);
    soundFx.playClick();
  };

  // Student Learning: Record session results
  const completeQuizSession = (data: {
    subject: Subject;
    topicId: string;
    total: number;
    correct: number;
    pointsEarned: number;
    starsEarned: number;
  }) => {
    if (!currentStudent) return { pointsAdded: 0 };

    const safePoints = Math.min(data.pointsEarned, 150);
    const safeStars = Math.min(data.starsEarned, 15);

    setRawStudents((prev) =>
      prev.map((s) => {
        if (s.id !== currentStudent.id) return s;

        const isMath = data.subject === 'math';
        const currentProg = isMath ? s.mathProgress : s.vietnameseProgress;

        const newTotalQ = currentProg.totalQuestions + data.total;
        const newCorrect = currentProg.correctAnswers + data.correct;
        const newAccuracy = Math.round((newCorrect / Math.max(newTotalQ, 1)) * 100);

        return {
          ...s,
          totalPoints: s.totalPoints + safePoints,
          totalStars: s.totalStars + safeStars,
          mathProgress: isMath
            ? {
                ...currentProg,
                totalQuestions: newTotalQ,
                correctAnswers: newCorrect,
                accuracy: newAccuracy,
                completedLessons: currentProg.completedLessons + 1,
              }
            : s.mathProgress,
          vietnameseProgress: !isMath
            ? {
                ...currentProg,
                totalQuestions: newTotalQ,
                correctAnswers: newCorrect,
                accuracy: newAccuracy,
                completedLessons: currentProg.completedLessons + 1,
              }
            : s.vietnameseProgress,
        };
      })
    );

    soundFx.playFanfare();
    return { pointsAdded: safePoints };
  };

  // Student Submissions for Classroom Exam Room
  const submitExamRoomAnswers = (
    matchId: string,
    answers: Record<string, string>
  ) => {
    const student = currentStudent || rawStudents[0];
    const match = challenges.find((c) => c.id === matchId);
    if (!match) throw new Error('Không tìm thấy phòng thi');

    let autoScore = 0;
    let hasEssay = false;

    const answerRecords: ExamSubmissionAnswer[] = match.questions.map((q) => {
      const studentAns = answers[q.id] || '';
      const maxScore = q.points || 10;
      let isCorrect: boolean | undefined = false;
      let awardedScore = 0;

      const normalize = (txt: string) => txt.trim().toLowerCase().replace(/\s+/g, ' ');

      if (q.type === 'multiple_choice') {
        isCorrect = normalize(studentAns) === normalize(q.correctAnswer || '');
        awardedScore = isCorrect ? maxScore : 0;
        autoScore += awardedScore;
      } else if (q.type === 'fill_in_blank') {
        const primary = normalize(q.correctAnswer || '');
        const acceptable = (q.acceptableAnswers || []).map(normalize);
        const given = normalize(studentAns);
        isCorrect = given === primary || acceptable.includes(given);
        awardedScore = isCorrect ? maxScore : 0;
        autoScore += awardedScore;
      } else if (q.type === 'short_answer') {
        hasEssay = true;
        isCorrect = undefined;
        awardedScore = 0;
      }

      return {
        questionId: q.id,
        questionType: q.type,
        studentAnswer: studentAns,
        isCorrect,
        awardedScore,
        maxScore,
      };
    });

    const maxPossibleScore = match.questions.reduce((sum, q) => sum + (q.points || 10), 0);

    const submission: ExamSubmission = {
      id: `sub_${Date.now()}_${student.id}`,
      matchId,
      roomCode: match.roomCode,
      studentId: student.id,
      studentName: student.name,
      studentAvatar: student.avatar,
      submittedAt: new Date().toISOString(),
      answers: answerRecords,
      autoScore,
      manualScore: 0,
      totalScore: autoScore,
      maxPossibleScore,
      isGradedByTeacher: !hasEssay,
    };

    setChallenges((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        const existing = m.submissions || [];
        const filtered = existing.filter((s) => s.studentId !== student.id);
        return {
          ...m,
          submissions: [submission, ...filtered],
        };
      })
    );

    setRawStudents((prev) =>
      prev.map((s) => {
        if (s.id !== student.id) return s;
        return {
          ...s,
          totalPoints: s.totalPoints + autoScore,
          totalStars: s.totalStars + Math.floor(autoScore / 10),
        };
      })
    );

    soundFx.playFanfare();
    return { submission, autoScore, needsManualGrading: hasEssay };
  };

  // Teacher manual grading
  const teacherGradeSubmission = (
    matchId: string,
    submissionId: string,
    essayScores: Record<string, number>,
    teacherComments: Record<string, string>,
    generalFeedback: string
  ) => {
    let studentIdToReward = '';
    let manualScoreDelta = 0;

    setChallenges((prev) =>
      prev.map((m) => {
        if (m.id !== matchId || !m.submissions) return m;

        const updatedSubmissions = m.submissions.map((sub) => {
          if (sub.id !== submissionId) return sub;

          studentIdToReward = sub.studentId;
          const previousManualScore = sub.manualScore;

          let newManualScore = 0;
          const updatedAnswers = sub.answers.map((ans) => {
            if (ans.questionType === 'short_answer') {
              const score = essayScores[ans.questionId] ?? ans.awardedScore ?? 0;
              const comment = teacherComments[ans.questionId] ?? ans.teacherComment ?? '';
              newManualScore += score;
              return {
                ...ans,
                awardedScore: score,
                teacherComment: comment,
                isCorrect: score >= ans.maxScore / 2,
              };
            }
            return ans;
          });

          manualScoreDelta = newManualScore - previousManualScore;

          return {
            ...sub,
            answers: updatedAnswers,
            manualScore: newManualScore,
            totalScore: sub.autoScore + newManualScore,
            isGradedByTeacher: true,
            teacherGeneralFeedback: generalFeedback,
          };
        });

        return {
          ...m,
          submissions: updatedSubmissions,
        };
      })
    );

    if (studentIdToReward && manualScoreDelta > 0) {
      setRawStudents((prev) =>
        prev.map((s) => {
          if (s.id !== studentIdToReward) return s;
          return {
            ...s,
            totalPoints: s.totalPoints + manualScoreDelta,
            totalStars: s.totalStars + Math.floor(manualScoreDelta / 10),
          };
        })
      );
    }

    soundFx.playCorrect();
  };

  // Teacher create exam room
  const teacherCreateExamRoom = (roomData: {
    title: string;
    subject: Subject;
    timeMinutes: number;
    selectedQuestionIds: string[];
  }) => {
    const selectedQ = questions.filter((q) => roomData.selectedQuestionIds.includes(q.id));
    const allowedTypes = Array.from(new Set(selectedQ.map((q) => q.type)));
    const hasEssay = selectedQ.some((q) => q.type === 'short_answer');
    const teacherName = currentTeacher ? currentTeacher.name : 'Giáo viên';
    const activeClassCode = currentClass ? currentClass.classCode : CURRENT_CLASS_CODE;

    const newMatch: ChallengeMatch = {
      id: `room_${Date.now()}`,
      roomCode: `P${activeClassCode}-${Math.floor(100 + Math.random() * 900)}`,
      type: 'class_room',
      title: roomData.title,
      classCode: activeClassCode,
      subject: roomData.subject,
      status: 'in_progress',
      hostStudentId: currentTeacher?.id || 'gv-01',
      hostStudentName: teacherName,
      hostAvatar: currentTeacher?.avatar || '👩‍🏫',
      hostScore: 0,
      hostProgress: 0,
      opponentScore: 0,
      opponentProgress: 0,
      questions: selectedQ.length > 0 ? selectedQ : questions.slice(0, 5),
      totalQuestions: selectedQ.length || 5,
      timePerQuestion: (roomData.timeMinutes * 60) / Math.max(selectedQ.length, 1),
      expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
      allowedQuestionTypes: allowedTypes,
      hasManualGrading: hasEssay,
      submissions: [],
    };

    setChallenges((prev) => [newMatch, ...prev]);
    soundFx.playFanfare();
    return newMatch;
  };

  // Create peer challenge
  const createChallenge = (params: {
    type: 'direct' | 'asynchronous' | 'class_room';
    title: string;
    subject: Subject;
    opponentStudentId?: string;
  }) => {
    const opp = params.opponentStudentId ? rawStudents.find((s) => s.id === params.opponentStudentId) : undefined;
    const filterQuestions = questions.filter((q) => q.subject === params.subject && q.isApprovedByTeacher);
    const chosenQuestions = filterQuestions.slice(0, 5);
    const classCode = currentClass?.classCode || CURRENT_CLASS_CODE;

    const newMatch: ChallengeMatch = {
      id: `match_${Date.now()}`,
      roomCode: `P${Math.floor(1000 + Math.random() * 9000)}`,
      type: params.type,
      title: params.title,
      classCode,
      subject: params.subject,
      status: 'waiting',
      hostStudentId: currentStudent?.id || 'hs-01',
      hostStudentName: currentStudent?.name || 'Học sinh',
      hostAvatar: currentStudent?.avatar || '🦊',
      hostScore: 0,
      hostProgress: 0,
      opponentStudentId: opp?.id,
      opponentStudentName: opp?.name,
      opponentAvatar: opp?.avatar,
      opponentScore: 0,
      opponentProgress: 0,
      questions: chosenQuestions.length >= 3 ? chosenQuestions : questions.slice(0, 5),
      totalQuestions: 5,
      timePerQuestion: 25,
      expiresAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    };

    setChallenges((prev) => [newMatch, ...prev]);
    soundFx.playCorrect();
    return newMatch;
  };

  const joinChallenge = (matchId: string) => {
    if (!currentStudent) return { success: false, message: 'Vui lòng đăng nhập' };

    let ok = false;
    let msg = '';

    setChallenges((prev) =>
      prev.map((m) => {
        if (m.id === matchId) {
          if (m.hostStudentId === currentStudent.id) {
            ok = true;
            msg = 'Bạn là người tạo phòng!';
            return m;
          }
          ok = true;
          msg = `Bạn đã tham gia phòng ${m.roomCode}`;
          return {
            ...m,
            opponentStudentId: currentStudent.id,
            opponentStudentName: currentStudent.name,
            opponentAvatar: currentStudent.avatar,
            status: 'in_progress',
          };
        }
        return m;
      })
    );

    return { success: ok, message: msg };
  };

  const finishChallengeMatch = (matchId: string, myScore: number, myProgress: number) => {
    if (!currentStudent) return;

    setChallenges((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;

        const isHost = m.hostStudentId === currentStudent.id;
        const newHostScore = isHost ? myScore : m.hostScore;
        const newOppScore = !isHost ? myScore : m.opponentScore;
        const newHostProg = isHost ? myProgress : m.hostProgress;
        const newOppProg = !isHost ? myProgress : m.opponentProgress;

        let winner: string | 'tie' | undefined = undefined;
        let newStatus = m.status;

        if (m.type === 'direct' || newOppProg >= m.totalQuestions) {
          newStatus = 'completed';
          if (newHostScore > newOppScore) winner = m.hostStudentId;
          else if (newOppScore > newHostScore) winner = m.opponentStudentId;
          else winner = 'tie';
        }

        return {
          ...m,
          hostScore: newHostScore,
          hostProgress: newHostProg,
          opponentScore: newOppScore,
          opponentProgress: newOppProg,
          status: newStatus,
          winnerId: winner,
        };
      })
    );
  };

  // Question actions
  const teacherApproveQuestion = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, isApprovedByTeacher: true } : q))
    );
    soundFx.playClick();
  };

  const teacherRejectQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    soundFx.playClick();
  };

  const teacherAddQuestion = (newQ: Omit<Question, 'id'>) => {
    const q: Question = {
      ...newQ,
      id: `q_custom_${Date.now()}`,
      isApprovedByTeacher: true,
      source: 'teacher_custom',
    };
    setQuestions((prev) => [q, ...prev]);
    soundFx.playCorrect();
  };

  // Student management within current class
  const teacherAddStudent = (data: {
    studentCode: string;
    name: string;
    pin: string;
    avatar: string;
    birthday?: string;
    gender?: 'Nam' | 'Nữ';
  }) => {
    const code = data.studentCode.trim().toUpperCase();
    const classCode = currentClass ? currentClass.classCode : CURRENT_CLASS_CODE;

    const exists = rawStudents.some(
      (s) => s.studentCode.toUpperCase() === code && s.classCode.toUpperCase() === classCode.toUpperCase()
    );
    if (exists) return false;

    const newStudent: Student = {
      id: `hs_${Date.now()}`,
      studentCode: code,
      name: data.name.trim(),
      classCode,
      classId: currentClass?.id,
      pin: data.pin.trim() || '1234',
      avatar: data.avatar || '🐼',
      birthday: data.birthday || '15/08/2018',
      gender: data.gender || 'Nam',
      totalPoints: 100,
      totalStars: 10,
      streakDays: 1,
      mathProgress: { completedLessons: 0, accuracy: 100, totalQuestions: 0, correctAnswers: 0 },
      vietnameseProgress: { completedLessons: 0, accuracy: 100, totalQuestions: 0, correctAnswers: 0 },
      badges: [BADGES_LIBRARY[0]],
      history: [{ date: new Date().toISOString().split('T')[0], pointsEarned: 100, lessonsDone: 1 }],
      teacherNotes: `Học sinh lớp ${classCode}.`,
      lastActiveDate: new Date().toISOString().split('T')[0],
    };

    setRawStudents((prev) => [newStudent, ...prev]);
    soundFx.playCorrect();
    return true;
  };

  const teacherUpdateStudentInfo = (studentId: string, updatedData: Partial<Student>) => {
    setRawStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, ...updatedData } : s))
    );
    soundFx.playClick();
  };

  const teacherDeleteStudent = (studentId: string) => {
    setRawStudents((prev) => prev.filter((s) => s.id !== studentId));
    soundFx.playClick();
  };

  const teacherImportExcelStudents = (
    importedList: Array<{
      studentCode?: string;
      name: string;
      birthday?: string;
      gender?: 'Nam' | 'Nữ';
      notes?: string;
    }>,
    mode: 'add_new' | 'update_existing' | 'replace_all'
  ) => {
    let addedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];
    const animalAvatars = ['🦊', '🦁', '🐰', '🐼', '🐯', '🦄', '🐨', '🐳', '🐱', '🦖', '🐶', '🐹', '🐥', '🦉', '🐻'];
    const activeClassCode = currentClass ? currentClass.classCode : CURRENT_CLASS_CODE;

    if (mode === 'replace_all') {
      // Replace only students belonging to the active class, preserve other classes
      const otherClassStudents = rawStudents.filter(
        (s) => s.classCode.toUpperCase() !== activeClassCode.toUpperCase()
      );

      const newList: Student[] = importedList.map((item, idx) => {
        const code = item.studentCode?.trim().toUpperCase() || `${activeClassCode}-${idx + 1 < 10 ? '0' : ''}${idx + 1}`;
        return {
          id: `hs_import_${Date.now()}_${idx}`,
          studentCode: code,
          name: item.name.trim(),
          classCode: activeClassCode,
          classId: currentClass?.id,
          pin: '1234',
          avatar: animalAvatars[idx % animalAvatars.length],
          birthday: item.birthday?.trim() || '15/08/2018',
          gender: item.gender === 'Nữ' ? 'Nữ' : 'Nam',
          totalPoints: 100,
          totalStars: 10,
          streakDays: 1,
          mathProgress: { completedLessons: 0, accuracy: 100, totalQuestions: 0, correctAnswers: 0 },
          vietnameseProgress: { completedLessons: 0, accuracy: 100, totalQuestions: 0, correctAnswers: 0 },
          badges: [BADGES_LIBRARY[0]],
          history: [{ date: new Date().toISOString().split('T')[0], pointsEarned: 100, lessonsDone: 1 }],
          teacherNotes: item.notes?.trim() || `Học sinh lớp ${activeClassCode} nhập từ file Excel.`,
          lastActiveDate: new Date().toISOString().split('T')[0],
        };
      });

      setRawStudents([...newList, ...otherClassStudents]);
      soundFx.playFanfare();
      return { added: newList.length, updated: 0, errors };
    }

    setRawStudents((prev) => {
      const nextList = [...prev];
      const classStudents = nextList.filter((s) => s.classCode.toUpperCase() === activeClassCode.toUpperCase());
      const existingMap = new Map(classStudents.map((s) => [s.studentCode.toUpperCase(), s]));

      importedList.forEach((item, idx) => {
        let code = item.studentCode?.trim().toUpperCase();
        if (!code) {
          code = `${activeClassCode}-${classStudents.length + 1 < 10 ? '0' : ''}${classStudents.length + 1}`;
        }

        if (existingMap.has(code)) {
          if (mode === 'update_existing') {
            const studentIdx = nextList.findIndex(
              (s) => s.studentCode.toUpperCase() === code && s.classCode.toUpperCase() === activeClassCode.toUpperCase()
            );
            if (studentIdx >= 0) {
              nextList[studentIdx] = {
                ...nextList[studentIdx],
                name: item.name.trim() || nextList[studentIdx].name,
                birthday: item.birthday?.trim() || nextList[studentIdx].birthday,
                gender: item.gender || nextList[studentIdx].gender,
                teacherNotes: item.notes?.trim() || nextList[studentIdx].teacherNotes,
              };
              updatedCount++;
            }
          }
        } else {
          // Add new
          const newStudent: Student = {
            id: `hs_import_${Date.now()}_${idx}`,
            studentCode: code,
            name: item.name.trim(),
            classCode: activeClassCode,
            classId: currentClass?.id,
            pin: '1234',
            avatar: animalAvatars[(classStudents.length + idx) % animalAvatars.length],
            birthday: item.birthday?.trim() || '15/08/2018',
            gender: item.gender === 'Nữ' ? 'Nữ' : 'Nam',
            totalPoints: 100,
            totalStars: 10,
            streakDays: 1,
            mathProgress: { completedLessons: 0, accuracy: 100, totalQuestions: 0, correctAnswers: 0 },
            vietnameseProgress: { completedLessons: 0, accuracy: 100, totalQuestions: 0, correctAnswers: 0 },
            badges: [BADGES_LIBRARY[0]],
            history: [{ date: new Date().toISOString().split('T')[0], pointsEarned: 100, lessonsDone: 1 }],
            teacherNotes: item.notes?.trim() || `Học sinh lớp ${activeClassCode} nhập từ file Excel.`,
            lastActiveDate: new Date().toISOString().split('T')[0],
          };
          nextList.push(newStudent);
          classStudents.push(newStudent);
          existingMap.set(code, newStudent);
          addedCount++;
        }
      });

      return nextList;
    });

    soundFx.playFanfare();
    return { added: addedCount, updated: updatedCount, errors };
  };

  const teacherResetStudentPin = (studentId: string, newPin: string) => {
    setRawStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, pin: newPin.trim() || '1234' } : s))
    );
    soundFx.playClick();
  };

  const teacherUpdateStudentNotes = (studentId: string, notes: string) => {
    setRawStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, teacherNotes: notes } : s))
    );
  };

  const teacherToggleLockStudent = (studentId: string, reason?: string) => {
    setRawStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const willBeLocked = !s.isLocked;
        return {
          ...s,
          isLocked: willBeLocked,
          accountStatus: willBeLocked ? 'locked' : (s.hasAccount ? 'active' : 'unregistered'),
          lockedReason: willBeLocked ? (reason || 'Tạm khóa theo quyết định của giáo viên') : undefined,
        };
      })
    );
    soundFx.playClick();
  };

  const teacherTransferStudent = (studentId: string, targetClassId: string) => {
    const target = classes.find((c) => c.id === targetClassId || c.classCode.toUpperCase() === targetClassId.toUpperCase());
    if (!target) {
      return { success: false, message: 'Không tìm thấy lớp học chuyển đến!' };
    }

    setRawStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          classId: target.id,
          classCode: target.classCode,
          teacherNotes: `${s.teacherNotes || ''}\n[Chuyển từ lớp khác sang ${target.name} ngày ${new Date().toLocaleDateString('vi-VN')}]`.trim(),
        };
      })
    );

    soundFx.playCorrect();
    return { success: true, message: `Đã chuyển học sinh thành công sang ${target.name} (${target.classCode})!` };
  };

  // Student Account Provisioning: Batch Account Creation for the whole class
  const batchCreateStudentAccounts = (
    classId: string,
    options?: { studentIds?: string[]; forceReset?: boolean }
  ): BatchAccountResult => {
    const targetClass = classes.find(
      (c) => c.id === classId || c.classCode.toUpperCase() === classId.toUpperCase()
    );
    if (!targetClass) {
      return {
        totalRequested: 0,
        newlyCreatedCount: 0,
        alreadyExistedCount: 0,
        failedCount: 1,
        items: [],
      };
    }

    const classCode = targetClass.classCode;
    const existingUsernames = new Set<string>();
    rawStudents.forEach((s) => {
      if (s.username) {
        existingUsernames.add(s.username.toLowerCase());
      }
    });

    const items: BatchAccountItem[] = [];
    let newlyCreatedCount = 0;
    let alreadyExistedCount = 0;
    let failedCount = 0;

    const updatedStudents = rawStudents.map((s) => {
      const isClassMatch = s.classCode.toUpperCase() === classCode.toUpperCase();
      if (!isClassMatch) return s;

      if (options?.studentIds && !options.studentIds.includes(s.id)) {
        return s;
      }

      const stt = items.length + 1;
      const alreadyHas = Boolean(s.hasAccount && s.username && (s.passwordHash || s.pin));

      if (alreadyHas && !options?.forceReset) {
        alreadyExistedCount++;
        items.push({
          stt,
          studentId: s.id,
          name: s.name,
          studentCode: s.studentCode,
          classCode: s.classCode,
          username: s.username || s.studentCode.toLowerCase(),
          initialPassword: s.initialPasswordPlain || '(Đã cấp trước đó)',
          status: 'already_exists',
        });
        return s;
      }

      try {
        const username =
          s.username || generateStudentUsername(s.name, classCode, existingUsernames);
        existingUsernames.add(username.toLowerCase());

        const initialPass = generateRandomStudentPassword(4);
        const passHash = sha256Sync(initialPass);

        newlyCreatedCount++;
        items.push({
          stt,
          studentId: s.id,
          name: s.name,
          studentCode: s.studentCode,
          classCode: s.classCode,
          username,
          initialPassword: initialPass,
          status: 'created',
        });

        return {
          ...s,
          username,
          pin: initialPass,
          passwordHash: passHash,
          initialPasswordPlain: initialPass,
          hasAccount: true,
          accountStatus: 'active' as const,
          accountCreatedAt: s.accountCreatedAt || new Date().toISOString(),
          lastPasswordResetAt: options?.forceReset ? new Date().toISOString() : s.lastPasswordResetAt,
          isLocked: false,
        };
      } catch (err: any) {
        failedCount++;
        items.push({
          stt,
          studentId: s.id,
          name: s.name,
          studentCode: s.studentCode,
          classCode: s.classCode,
          username: '',
          status: 'error',
          errorMessage: err?.message || 'Lỗi khi tạo tài khoản',
        });
        return s;
      }
    });

    setRawStudents(updatedStudents);
    soundFx.playFanfare();

    return {
      totalRequested: items.length,
      newlyCreatedCount,
      alreadyExistedCount,
      failedCount,
      items,
    };
  };

  // Reset Student Password (when a student forgets)
  const teacherResetStudentPassword = (studentId: string, customNewPassword?: string) => {
    let finalPassword = '';
    let foundStudent: Student | null = null;

    setRawStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        foundStudent = s;
        finalPassword = customNewPassword?.trim() || generateRandomStudentPassword(4);
        const passHash = sha256Sync(finalPassword);
        return {
          ...s,
          pin: finalPassword,
          passwordHash: passHash,
          initialPasswordPlain: finalPassword,
          hasAccount: true,
          accountStatus: 'active' as const,
          lastPasswordResetAt: new Date().toISOString(),
          isLocked: false,
        };
      })
    );

    if (!foundStudent) {
      return { success: false, newPassword: '', message: 'Không tìm thấy học sinh!' };
    }

    soundFx.playCorrect();
    return {
      success: true,
      newPassword: finalPassword,
      message: `Đã cấp lại mật khẩu mới cho học sinh ${(foundStudent as Student).name}: "${finalPassword}"`,
    };
  };

  // Create account for single student
  const teacherCreateStudentAccount = (
    studentId: string,
    customUsername?: string,
    customPassword?: string
  ) => {
    let assignedUsername = '';
    let assignedPassword = '';
    let studentName = '';

    setRawStudents((prev) => {
      const existingUsernames = new Set(
        prev.map((s) => s.username?.toLowerCase()).filter(Boolean) as string[]
      );
      return prev.map((s) => {
        if (s.id !== studentId) return s;
        studentName = s.name;
        assignedUsername =
          customUsername?.trim().toLowerCase() ||
          s.username ||
          generateStudentUsername(s.name, s.classCode, existingUsernames);
        assignedPassword = customPassword?.trim() || generateRandomStudentPassword(4);
        const passHash = sha256Sync(assignedPassword);

        return {
          ...s,
          username: assignedUsername,
          pin: assignedPassword,
          passwordHash: passHash,
          initialPasswordPlain: assignedPassword,
          hasAccount: true,
          accountStatus: 'active' as const,
          accountCreatedAt: new Date().toISOString(),
          isLocked: false,
        };
      });
    });

    soundFx.playCorrect();
    return {
      success: true,
      username: assignedUsername,
      initialPassword: assignedPassword,
      message: `Tạo tài khoản thành công cho ${studentName}! Tên đăng nhập: ${assignedUsername}`,
    };
  };

  // Badge calculations
  const getStudentBadgesWithProgress = (student: Student): Badge[] => {
    return BADGES_LIBRARY.map((badge) => {
      let currentVal = 0;
      let unlocked = false;

      switch (badge.id) {
        case 'b-math-champ':
          currentVal = student.mathProgress.completedLessons;
          unlocked = currentVal >= badge.targetCount;
          break;
        case 'b-viet-master':
          currentVal = student.vietnameseProgress.accuracy;
          unlocked = currentVal >= badge.targetCount && student.vietnameseProgress.completedLessons >= 5;
          break;
        case 'b-speedy-calc':
          currentVal = Math.min(student.mathProgress.correctAnswers, 25);
          unlocked = currentVal >= badge.targetCount;
          break;
        case 'b-young-pen':
          currentVal = student.vietnameseProgress.completedLessons >= 3 ? 3 : 1;
          unlocked = currentVal >= badge.targetCount;
          break;
        case 'b-hardworking':
          currentVal = student.streakDays;
          unlocked = currentVal >= badge.targetCount;
          break;
        case 'b-star-collector':
          currentVal = student.totalStars;
          unlocked = currentVal >= badge.targetCount;
          break;
        case 'b-great-progress':
          currentVal = Math.max(15, Math.round(student.mathProgress.accuracy / 6));
          unlocked = true;
          break;
        case 'b-early-bird':
          currentVal = student.history.length;
          unlocked = currentVal >= badge.targetCount;
          break;
        case 'b-arena-warrior':
          currentVal = challenges.filter(
            (c) => c.hostStudentId === student.id || c.opponentStudentId === student.id
          ).length;
          unlocked = currentVal >= badge.targetCount;
          break;
        case 'b-speedy':
          currentVal = challenges.filter((c) => c.winnerId === student.id).length;
          unlocked = currentVal >= badge.targetCount;
          break;
        case 'b-teacher-challenge':
          currentVal = challenges.filter((c) =>
            (c.submissions || []).some((s) => s.studentId === student.id)
          ).length;
          unlocked = currentVal >= badge.targetCount;
          break;
        case 'b-friendship':
          currentVal = challenges.filter(
            (c) => c.type === 'asynchronous' && c.hostStudentId === student.id
          ).length;
          unlocked = currentVal >= badge.targetCount;
          break;
        default:
          unlocked = false;
      }

      return {
        ...badge,
        currentCount: Math.min(currentVal, badge.targetCount),
        isUnlocked: unlocked,
        unlockedAt: unlocked ? '2026-10-17' : undefined,
      };
    });
  };

  // Leaderboard computations (ranked within active class)
  const getLeaderboard = (type: 'gold' | 'progress' | 'diligent'): LeaderboardItem[] => {
    const list: LeaderboardItem[] = students.map((s) => {
      const avgAcc = Math.round((s.mathProgress.accuracy + s.vietnameseProgress.accuracy) / 2);
      const recentGrowth = s.history.reduce((sum, h) => sum + h.pointsEarned, 0);
      const badgesCount = getStudentBadgesWithProgress(s).filter((b) => b.isUnlocked).length;

      return {
        id: s.id,
        studentCode: s.studentCode,
        name: s.name,
        avatar: s.avatar,
        classCode: s.classCode,
        points: s.totalPoints,
        stars: s.totalStars,
        accuracy: avgAcc,
        streakDays: s.streakDays,
        badgeCount: badgesCount,
        recentGrowthPoints: recentGrowth,
        rank: 0,
      };
    });

    if (type === 'gold') {
      list.sort((a, b) => b.points - a.points);
    } else if (type === 'progress') {
      list.sort((a, b) => b.recentGrowthPoints - a.recentGrowthPoints || b.accuracy - a.accuracy);
    } else {
      list.sort((a, b) => b.streakDays - a.streakDays || b.stars - a.stars);
    }

    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  };

  // Curriculum recordLessonCompletion
  const recordLessonCompletion = (data: {
    lessonId: string;
    lessonTitle: string;
    subject: Subject;
    volume: 1 | 2;
    activityType: LessonActivityType;
    activityName: string;
    totalQuestions: number;
    correctCount: number;
    score: number;
    commonWrongTopics?: string[];
  }) => {
    if (!currentStudent) return { pointsAdded: 0, starsAdded: 0, isFirstOrImproved: false };

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const previous = studentLessonResults.find(
      (r) =>
        r.studentId === currentStudent.id &&
        r.lessonId === data.lessonId &&
        r.activityType === data.activityType
    );

    let isFirstOrImproved = false;
    let pointsToAdd = 0;
    let starsToAdd = 0;

    if (!previous) {
      isFirstOrImproved = true;
      pointsToAdd = Math.round((data.correctCount / Math.max(data.totalQuestions, 1)) * 30) + 10;
      starsToAdd =
        data.correctCount === data.totalQuestions
          ? 3
          : data.correctCount >= Math.ceil(data.totalQuestions * 0.7)
          ? 2
          : 1;
    } else if (data.score > previous.score) {
      isFirstOrImproved = true;
      const scoreDiff = data.score - previous.score;
      pointsToAdd = Math.max(Math.round(scoreDiff * 0.2), 5);
      starsToAdd = data.score === 100 && previous.score < 100 ? 1 : 0;
    } else {
      isFirstOrImproved = false;
      pointsToAdd = 0;
      starsToAdd = 0;
    }

    const newResult: StudentLessonResult = {
      id: `lr_${Date.now()}`,
      studentId: currentStudent.id,
      studentCode: currentStudent.studentCode,
      lessonId: data.lessonId,
      lessonTitle: data.lessonTitle,
      subject: data.subject,
      volume: data.volume,
      activityType: data.activityType,
      activityName: data.activityName,
      date: today,
      completedAt: `${today} ${nowTime}`,
      totalQuestions: data.totalQuestions,
      correctCount: data.correctCount,
      wrongCount: Math.max(data.totalQuestions - data.correctCount, 0),
      score: data.score,
      pointsAwarded: pointsToAdd,
      starsAwarded: starsToAdd,
      commonWrongTopics: data.commonWrongTopics,
    };

    setStudentLessonResults((prev) => [newResult, ...prev]);

    if (pointsToAdd > 0 || starsToAdd > 0 || isFirstOrImproved) {
      setRawStudents((prev) =>
        prev.map((s) => {
          if (s.id !== currentStudent.id) return s;

          const isMath = data.subject === 'math';
          const prevProg = isMath ? s.mathProgress : s.vietnameseProgress;

          const newTotalQuestions = prevProg.totalQuestions + data.totalQuestions;
          const newCorrect = prevProg.correctAnswers + data.correctCount;
          const newAccuracy = Math.round((newCorrect / Math.max(newTotalQuestions, 1)) * 100);
          const newCompletedLessons = isFirstOrImproved ? prevProg.completedLessons + 1 : prevProg.completedLessons;

          return {
            ...s,
            totalPoints: s.totalPoints + pointsToAdd,
            totalStars: s.totalStars + starsToAdd,
            lastActiveDate: today,
            streakDays: s.lastActiveDate === today ? s.streakDays : s.streakDays + 1,
            mathProgress: isMath
              ? {
                  completedLessons: newCompletedLessons,
                  accuracy: newAccuracy,
                  totalQuestions: newTotalQuestions,
                  correctAnswers: newCorrect,
                }
              : s.mathProgress,
            vietnameseProgress: !isMath
              ? {
                  completedLessons: newCompletedLessons,
                  accuracy: newAccuracy,
                  totalQuestions: newTotalQuestions,
                  correctAnswers: newCorrect,
                }
              : s.vietnameseProgress,
            detailedStudyHistory: [
              {
                id: `rec_${Date.now()}`,
                date: today,
                subject: data.subject,
                topicName: `${data.lessonTitle} (${data.activityName})`,
                totalQuestions: data.totalQuestions,
                correctCount: data.correctCount,
                score: data.score,
                incorrectTopics: data.commonWrongTopics || [],
              },
              ...(s.detailedStudyHistory || []),
            ],
          };
        })
      );
    }

    return { pointsAdded: pointsToAdd, starsAdded: starsToAdd, isFirstOrImproved };
  };

  const teacherAssignHomework = (hwData: Omit<AssignedHomework, 'id' | 'submissions'>): AssignedHomework => {
    const newHw: AssignedHomework = {
      ...hwData,
      id: `hw_${Date.now()}`,
      submissions: [],
    };
    setAssignedHomeworks((prev) => [newHw, ...prev]);
    soundFx.playCorrect();
    return newHw;
  };

  const submitHomeworkAnswer = (
    hwId: string,
    submission: {
      score: number;
      correctCount: number;
      totalQuestions: number;
      teacherRemark?: string;
    }
  ) => {
    if (!currentStudent) return;
    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setAssignedHomeworks((prev) =>
      prev.map((hw) => {
        if (hw.id !== hwId) return hw;
        const existingIdx = hw.submissions.findIndex((s) => s.studentId === currentStudent.id);
        const subItem = {
          studentId: currentStudent.id,
          studentName: currentStudent.name,
          studentAvatar: currentStudent.avatar,
          completedAt: nowTime,
          score: submission.score,
          correctCount: submission.correctCount,
          totalQuestions: submission.totalQuestions,
          isGraded: true,
          teacherRemark: submission.teacherRemark || 'Thầy cô khen con đã hoàn thành bài tập!',
        };

        if (existingIdx >= 0) {
          const updatedSubs = [...hw.submissions];
          updatedSubs[existingIdx] = subItem;
          return { ...hw, submissions: updatedSubs };
        } else {
          return { ...hw, submissions: [...hw.submissions, subItem] };
        }
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        currentStudent,
        currentTeacher,
        currentClass,
        isLoggedIn,
        teachers,
        classes,
        students,
        allStudents: rawStudents,
        topics: MOCK_TOPICS,
        questions,
        challenges,
        mistakeStats: MOCK_MISTAKES_STAT,
        assignedHomeworks,
        studentLessonResults,
        recordLessonCompletion,
        teacherAssignHomework,
        submitHomeworkAnswer,
        loginStudent,
        loginTeacher,
        registerTeacher,
        logout,
        quickSwitchDemoUser,
        updateTeacherProfile,
        changeTeacherPassword,
        resetTeacherPassword,
        createClass,
        updateClassInfo,
        switchActiveClass,
        completeQuizSession,
        createChallenge,
        joinChallenge,
        finishChallengeMatch,
        submitExamRoomAnswers,
        teacherGradeSubmission,
        teacherCreateExamRoom,
        teacherApproveQuestion,
        teacherRejectQuestion,
        teacherAddQuestion,
        teacherAddStudent,
        teacherUpdateStudentInfo,
        teacherDeleteStudent,
        teacherImportExcelStudents,
        teacherResetStudentPin,
        teacherUpdateStudentNotes,
        teacherToggleLockStudent,
        teacherTransferStudent,
        batchCreateStudentAccounts,
        teacherResetStudentPassword,
        teacherCreateStudentAccount,
        getLeaderboard,
        getStudentBadgesWithProgress,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
