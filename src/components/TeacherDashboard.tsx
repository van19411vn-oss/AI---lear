import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Question, QuestionType, Subject, Difficulty, ChallengeMatch, ClassRoom } from '../types';
import { soundFx } from '../utils/sound';
import { StudentRosterView } from './StudentRosterView';
import { CurriculumTeacherManager } from './curriculum/CurriculumTeacherManager';
import { StudentAccountManager } from './StudentAccountManager';
import {
  GraduationCap,
  Users,
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  Plus,
  Key,
  Download,
  AlertTriangle,
  Bot,
  BrainCircuit,
  FileCheck,
  Edit,
  Clock,
  Printer,
  ChevronDown,
  UserCog,
  School,
  X,
  KeyRound,
  Save,
  Settings,
  LogOut,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const {
    currentTeacher,
    currentClass,
    classes,
    students,
    allStudents,
    questions,
    challenges,
    mistakeStats,
    teacherApproveQuestion,
    teacherRejectQuestion,
    teacherAddQuestion,
    teacherAddStudent,
    teacherResetStudentPin,
    teacherUpdateStudentNotes,
    teacherGradeSubmission,
    teacherCreateExamRoom,
    createClass,
    updateClassInfo,
    switchActiveClass,
    updateTeacherProfile,
    changeTeacherPassword,
    logout,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'grading' | 'exam_builder' | 'accounts' | 'students' | 'classes' | 'homework' | 'ai_creator' | 'mistakes'
  >('accounts');

  // Class dropdown & modals state
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);

  // Create class form state
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassYear, setNewClassYear] = useState('2024 - 2025');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [classActionError, setClassActionError] = useState('');

  // Profile modal state
  const [profileName, setProfileName] = useState(currentTeacher?.name || '');
  const [profileRole, setProfileRole] = useState(currentTeacher?.roleTitle || '');
  const [profileSchool, setProfileSchool] = useState(currentTeacher?.schoolName || '');
  const [profileAvatar, setProfileAvatar] = useState(currentTeacher?.avatar || '👩‍🏫');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Grading state
  const [selectedMatchForGrading, setSelectedMatchForGrading] = useState<string>(
    challenges.find((c) => c.type === 'class_room')?.id || ''
  );
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [essayScores, setEssayScores] = useState<Record<string, number>>({});
  const [essayComments, setEssayComments] = useState<Record<string, string>>({});
  const [generalFeedback, setGeneralFeedback] = useState('Thầy cô khen con làm bài rất cố gắng!');

  // AI Quiz Creator state
  const [aiSubject, setAiSubject] = useState<Subject>('math');
  const [aiTopic, setAiTopic] = useState('Phép cộng, trừ có nhớ trong phạm vi 100');
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('medium');
  const [aiCount, setAiCount] = useState<number>(3);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiQuestionsQueue, setAiQuestionsQueue] = useState<Question[]>([]);

  // Exam Builder state
  const [examTitle, setExamTitle] = useState(`Đề Khảo Sát Năng Lực Giữa Kỳ - ${currentClass?.name || 'Lớp 2'}`);
  const [examSubject, setExamSubject] = useState<Subject>('vietnamese');
  const [examTimeMin, setExamTimeMin] = useState(15);
  const [selectedQuestionsForExam, setSelectedQuestionsForExam] = useState<string[]>(
    questions.slice(0, 5).map((q) => q.id)
  );

  // AI Pedagogy analysis
  const [aiPedagogyAnalysis, setAiPedagogyAnalysis] = useState<string>('');
  const [isLoadingPedagogy, setIsLoadingPedagogy] = useState(false);

  // Classes belonging to this teacher
  const teacherClasses = classes.filter(
    (c) => currentTeacher?.managedClassIds?.includes(c.id) || c.teacherId === currentTeacher?.id
  );

  // Sync profile data when teacher changes
  React.useEffect(() => {
    if (currentTeacher) {
      setProfileName(currentTeacher.name);
      setProfileRole(currentTeacher.roleTitle);
      setProfileSchool(currentTeacher.schoolName);
      setProfileAvatar(currentTeacher.avatar);
    }
  }, [currentTeacher]);

  // Export report to CSV
  const handleExportCSV = () => {
    const headers = 'STT,Mã Học Sinh,Họ Và Tên,Lớp,Mã PIN,Tổng Điểm,Sao,Độ Chính Xác Toán %,Độ Chính Xác Tiếng Việt %\n';
    const rows = students
      .map(
        (s, idx) =>
          `${idx + 1},${s.studentCode},"${s.name}",${s.classCode},${s.pin},${s.totalPoints},${s.totalStars},${s.mathProgress.accuracy},${s.vietnameseProgress.accuracy}`
      )
      .join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanClassCode = currentClass ? currentClass.classCode : 'Lop2';
    link.setAttribute('download', `Bao_Cao_Hoc_Tap_${cleanClassCode}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    soundFx.playCorrect();
  };

  // Create new class handler
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    setClassActionError('');

    if (!newClassCode.trim()) {
      setClassActionError('Vui lòng nhập mã lớp!');
      return;
    }

    const res = createClass({
      classCode: newClassCode.trim().toUpperCase(),
      name: newClassName.trim() || `Lớp ${newClassCode.trim().toUpperCase()}`,
      academicYear: newClassYear.trim() || '2024 - 2025',
      description: newClassDesc.trim(),
    });

    if (res.success) {
      setIsCreateClassModalOpen(false);
      setNewClassCode('');
      setNewClassName('');
      setNewClassDesc('');
    } else {
      setClassActionError(res.message);
      soundFx.playEncourage();
    }
  };

  // Update profile handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    const res = updateTeacherProfile({
      name: profileName.trim(),
      roleTitle: profileRole.trim(),
      schoolName: profileSchool.trim(),
      avatar: profileAvatar,
    });
    if (res.success) {
      setProfileSuccess('Đã lưu thông tin giáo viên!');
      setTimeout(() => setProfileSuccess(''), 2500);
    }
  };

  // Change password handler
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu mới và xác nhận mật khẩu không trùng khớp!');
      return;
    }
    if (newPassword.length < 3) {
      setPasswordError('Mật khẩu mới phải có ít nhất 3 ký tự!');
      return;
    }

    const res = changeTeacherPassword(oldPassword, newPassword);
    if (res.success) {
      setPasswordSuccess(res.message);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } else {
      setPasswordError(res.message);
      soundFx.playEncourage();
    }
  };

  // AI Question Generation call
  const handleGenerateAIQuestions = async () => {
    setIsGeneratingAI(true);
    soundFx.playClick();
    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: aiSubject,
          topic: aiTopic,
          difficulty: aiDifficulty,
          count: aiCount,
        }),
      });
      const data = await res.json();
      const generated = (data.questions || []).map((q: any) => ({
        ...q,
        type: 'multiple_choice',
        subject: aiSubject,
        topicId: 'ai-generated',
        topicName: aiTopic,
        points: 10,
        hint: q.hint || 'Hãy suy nghĩ cẩn thận nhé!',
        explanation: q.explanation || 'Đáp án chính xác theo chương trình học.',
      }));

      setAiQuestionsQueue((prev) => [...generated, ...prev]);
      soundFx.playCorrect();
    } catch {
      // Fallback generator
      const mockAiQuestions: Question[] = [
        {
          id: `ai_${Date.now()}_1`,
          type: 'multiple_choice',
          subject: aiSubject,
          topicId: 'ai-gen',
          topicName: aiTopic,
          difficulty: aiDifficulty,
          question: `[AI Soạn Thảo] Kết quả của phép tính nào dưới đây là chính xác cho bài học "${aiTopic}"?`,
          options: ['45 + 18 = 63', '37 + 25 = 61', '52 - 18 = 35', '60 - 24 = 38'],
          correctAnswer: '45 + 18 = 63',
          points: 10,
          hint: 'Cộng hàng đơn vị có nhớ 1 sang hàng chục.',
          explanation: '5 + 8 = 13 viết 3 nhớ 1; 4 + 1 = 5 thêm 1 là 6. Vậy 45 + 18 = 63.',
          isApprovedByTeacher: false,
        },
      ];
      setAiQuestionsQueue((prev) => [...mockAiQuestions, ...prev]);
      soundFx.playCorrect();
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // AI Pedagogy Analysis
  const handleAnalyzeMistakesAI = async () => {
    setIsLoadingPedagogy(true);
    soundFx.playClick();
    try {
      const res = await fetch('/api/ai/analyze-mistakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats: mistakeStats,
          className: currentClass?.name || 'Lớp 2',
        }),
      });
      const data = await res.json();
      setAiPedagogyAnalysis(data.analysis || 'Lớp đang tiến bộ rõ rệt ở môn Toán và Tiếng Việt.');
      soundFx.playFanfare();
    } catch {
      setAiPedagogyAnalysis(
        `Phân tích sư phạm AI cho ${currentClass?.name || 'lớp'}:\n1. Về môn Toán: Học sinh hay quên cộng số nhớ ở hàng chục trong phép cộng có nhớ dạng 38 + 25. Đề xuất: Cho học sinh luyện tập chấm một chấm tròn nhỏ ở trên số nhớ.\n2. Về môn Tiếng Việt: Lỗi nhầm lẫn giữa chữ tr và ch khi phát âm vùng miền. Đề xuất: Giáo viên cho các em chơi trò chơi ghép chữ theo tranh minh họa trực quan.`
      );
      soundFx.playFanfare();
    } finally {
      setIsLoadingPedagogy(false);
    }
  };

  const handleSaveGrading = (matchId: string, subId: string) => {
    teacherGradeSubmission(matchId, subId, essayScores, essayComments, generalFeedback);
    setGradingSubmissionId(null);
  };

  const handleCreateRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestionsForExam.length === 0) {
      alert('Vui lòng chọn ít nhất 1 câu hỏi cho phòng thi!');
      return;
    }
    teacherCreateExamRoom({
      title: examTitle,
      subject: examSubject,
      timeMinutes: examTimeMin,
      selectedQuestionIds: selectedQuestionsForExam,
    });
    alert(`Đã phát hành phòng thi thành công cho ${currentClass?.name || 'lớp'}! Học sinh có thể tham gia ngay.`);
    setActiveTab('grading');
  };

  const currentExamRoom = challenges.find((c) => c.id === selectedMatchForGrading);
  const examSubmissions = currentExamRoom?.submissions || [];

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Teacher Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-200 mb-8 border-3 border-indigo-400/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <span className="text-5xl sm:text-6xl p-3 bg-white/10 rounded-2xl border border-white/20 select-none">
              {currentTeacher?.avatar || '👩‍🏫'}
            </span>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase mb-1">
                Bảng Điều Khiển Giáo Viên
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">
                Xin chào, {currentTeacher?.name || 'Thầy Cô'}! 🌟
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-0.5">
                {currentTeacher?.roleTitle || 'Giáo viên'} • {currentTeacher?.schoolName || 'Trường Tiểu học'}
              </p>

              {/* Class Selector Dropdown */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-300">Đang phụ trách:</span>
                <div className="relative inline-block">
                  <button
                    onClick={() => setShowClassDropdown(!showClassDropdown)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm rounded-xl border border-indigo-400/50 flex items-center gap-2 shadow-xs transition"
                  >
                    <span>🏫 {currentClass?.name || 'Chưa chọn lớp'}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {showClassDropdown && (
                    <div className="absolute left-0 mt-2 w-64 bg-white text-slate-900 rounded-2xl shadow-2xl border-2 border-indigo-200 p-2 z-50 animate-pop">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400 px-2 py-1">
                        Chọn lớp làm việc:
                      </div>
                      {teacherClasses.map((cls) => (
                        <button
                          key={cls.id}
                          onClick={() => {
                            switchActiveClass(cls.id);
                            setShowClassDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between mb-1 transition ${
                            currentClass?.id === cls.id
                              ? 'bg-indigo-100 text-indigo-900 font-black'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <div>{cls.name}</div>
                            <div className="text-[10px] font-normal text-slate-500">
                              Mã lớp: {cls.classCode} • {cls.academicYear}
                            </div>
                          </div>
                          {currentClass?.id === cls.id && (
                            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                          )}
                        </button>
                      ))}

                      <div className="border-t border-slate-100 my-1"></div>

                      <button
                        onClick={() => {
                          setShowClassDropdown(false);
                          setIsCreateClassModalOpen(true);
                        }}
                        className="w-full text-center px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Tạo lớp học mới</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-2xl border border-white/20 transition flex items-center gap-1.5"
            >
              <UserCog className="w-4 h-4 text-amber-300" />
              <span>Hồ sơ & Đổi mật khẩu</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center gap-1.5 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Báo Cáo (CSV)</span>
            </button>

            <button
              onClick={() => {
                logout();
                soundFx.playClick();
              }}
              className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 hover:text-white font-bold text-xs sm:text-sm rounded-2xl border border-rose-400/30 transition flex items-center gap-1.5"
              title="Đăng xuất khỏi tài khoản giáo viên"
            >
              <LogOut className="w-4 h-4 text-rose-300" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto gap-2">
        <button
          onClick={() => {
            setActiveTab('grading');
            soundFx.playClick();
          }}
          className={`pb-3 px-4 font-black text-xs sm:text-sm whitespace-nowrap border-b-3 transition flex items-center gap-2 ${
            activeTab === 'grading'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Chấm Bài Thi Của Cô</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-extrabold">
            {examSubmissions.filter((s) => !s.isGradedByTeacher).length} cần chấm
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('exam_builder');
            soundFx.playClick();
          }}
          className={`pb-3 px-4 font-black text-xs sm:text-sm whitespace-nowrap border-b-3 transition flex items-center gap-2 ${
            activeTab === 'exam_builder'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Đề Thi Mới</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('accounts');
            soundFx.playClick();
          }}
          className={`pb-3 px-4 font-black text-xs sm:text-sm whitespace-nowrap border-b-3 transition flex items-center gap-2 ${
            activeTab === 'accounts'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4 text-amber-500" />
          <span>Quản Lý Tài Khoản Học Sinh</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-extrabold">
            Mới 🔐
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('students');
            soundFx.playClick();
          }}
          className={`pb-3 px-4 font-black text-xs sm:text-sm whitespace-nowrap border-b-3 transition flex items-center gap-2 ${
            activeTab === 'students'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Danh Sách Học Sinh ({students.length} em - {currentClass?.name || 'Lớp'})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('classes');
            soundFx.playClick();
          }}
          className={`pb-3 px-4 font-black text-xs sm:text-sm whitespace-nowrap border-b-3 transition flex items-center gap-2 ${
            activeTab === 'classes'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Lớp Học Của Tôi ({teacherClasses.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('homework');
            soundFx.playClick();
          }}
          className={`pb-3 px-4 font-black text-xs sm:text-sm whitespace-nowrap border-b-3 transition flex items-center gap-2 ${
            activeTab === 'homework'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Giao Bài Tập SGK</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('ai_creator');
            soundFx.playClick();
          }}
          className={`pb-3 px-4 font-black text-xs sm:text-sm whitespace-nowrap border-b-3 transition flex items-center gap-2 ${
            activeTab === 'ai_creator'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Soạn Câu Hỏi Bằng AI</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('mistakes');
            soundFx.playClick();
          }}
          className={`pb-3 px-4 font-black text-xs sm:text-sm whitespace-nowrap border-b-3 transition flex items-center gap-2 ${
            activeTab === 'mistakes'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          <span>Thống Kê Lỗi Sai & AI Sư Phạm</span>
        </button>
      </div>

      {/* ================= TAB 1: CHẤM BÀI THI CỦA CÔ ================= */}
      {activeTab === 'grading' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border-3 border-slate-100 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Chấm Điểm & Nhận Xét Bài Thi Học Sinh ({currentClass?.name || 'Lớp'})
                </h2>
                <p className="text-xs text-slate-500 font-semibold">
                  Hệ thống đã tự động chấm các câu Trắc nghiệm & Điền từ. Giáo viên xem và nhập điểm cho câu Tự luận ngắn.
                </p>
              </div>

              {/* Select Exam Room */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Chọn phòng thi:</span>
                <select
                  value={selectedMatchForGrading}
                  onChange={(e) => setSelectedMatchForGrading(e.target.value)}
                  className="p-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {challenges
                    .filter((c) => c.type === 'class_room')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.roomCode})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* List of Submissions */}
            {examSubmissions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Chưa có học sinh nào nộp bài vào phòng thi này.
              </div>
            ) : (
              <div className="space-y-4">
                {examSubmissions.map((sub) => {
                  const isGradingThis = gradingSubmissionId === sub.id;
                  const essayQuestions = sub.answers.filter((a) => a.questionType === 'short_answer');

                  return (
                    <div
                      key={sub.id}
                      className="border-2 border-slate-200 rounded-2xl p-5 hover:border-indigo-300 transition bg-white"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl p-2 bg-slate-100 rounded-xl">{sub.studentAvatar}</span>
                          <div>
                            <div className="font-black text-sm text-slate-900">{sub.studentName}</div>
                            <div className="text-[11px] text-slate-400">
                              Nộp lúc: {new Date(sub.submittedAt).toLocaleTimeString('vi-VN')} {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xs font-extrabold text-slate-500">Tổng điểm:</div>
                            <div className="text-xl font-black text-indigo-700">
                              {sub.totalScore} / {sub.maxPossibleScore}
                            </div>
                          </div>

                          {sub.isGradedByTeacher ? (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đã chấm</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setGradingSubmissionId(isGradingThis ? null : sub.id);
                                soundFx.playClick();
                              }}
                              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-black text-xs rounded-xl shadow-xs transition"
                            >
                              Chấm bài ✏️
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Grading Drawer */}
                      {isGradingThis && (
                        <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-xl space-y-4">
                          <h4 className="text-xs font-black text-indigo-900 uppercase">
                            Chấm các câu tự luận ngắn ({essayQuestions.length} câu):
                          </h4>

                          {essayQuestions.map((eq, qIdx) => (
                            <div key={eq.questionId} className="bg-white p-3 rounded-xl border border-slate-200">
                              <div className="text-xs font-bold text-slate-700 mb-1">
                                Câu tự luận #{qIdx + 1}:
                              </div>
                              <div className="p-2.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-800 mb-2">
                                &quot;{eq.studentAnswer || '(Học sinh không trả lời)'}&quot;
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[11px] font-bold text-slate-600 block mb-0.5">
                                    Điểm tự luận (tối đa {eq.maxScore}):
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={eq.maxScore}
                                    value={essayScores[eq.questionId] ?? eq.awardedScore ?? eq.maxScore}
                                    onChange={(e) =>
                                      setEssayScores((prev) => ({
                                        ...prev,
                                        [eq.questionId]: Number(e.target.value),
                                      }))
                                    }
                                    className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-bold text-slate-600 block mb-0.5">
                                    Nhận xét của cô cho câu này:
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Viết tròn câu, đúng chính tả..."
                                    value={essayComments[eq.questionId] ?? eq.teacherComment ?? ''}
                                    onChange={(e) =>
                                      setEssayComments((prev) => ({
                                        ...prev,
                                        [eq.questionId]: e.target.value,
                                      }))
                                    }
                                    className="w-full p-2 bg-slate-50 border rounded-lg text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}

                          <div>
                            <label className="text-xs font-black text-slate-700 block mb-1">
                              Lời khen / Góp ý chung của giáo viên:
                            </label>
                            <input
                              type="text"
                              value={generalFeedback}
                              onChange={(e) => setGeneralFeedback(e.target.value)}
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              onClick={() => setGradingSubmissionId(null)}
                              className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleSaveGrading(selectedMatchForGrading, sub.id)}
                              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs"
                            >
                              Lưu kết quả & Gửi điểm cho học sinh ⭐
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: TẠO ĐỀ THI MỚI (EXAM BUILDER) ================= */}
      {activeTab === 'exam_builder' && (
        <div className="bg-white rounded-3xl p-6 border-3 border-slate-100 shadow-md">
          <h2 className="text-lg font-black text-slate-900 mb-1">
            Tạo Phòng Thi & Đề Khảo Sát - {currentClass?.name || 'Lớp 2'}
          </h2>
          <p className="text-xs text-slate-500 font-semibold mb-6">
            Thầy cô có thể kết hợp cả 3 dạng: Trắc nghiệm, Điền từ vào chỗ trống, và Tự luận ngắn.
          </p>

          <form onSubmit={handleCreateRoomSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-black text-slate-700 block mb-1">Tên đề thi / Phòng thi:</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs sm:text-sm text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Thời gian làm bài:</label>
                <select
                  value={examTimeMin}
                  onChange={(e) => setExamTimeMin(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs sm:text-sm text-slate-900"
                >
                  <option value={10}>10 phút</option>
                  <option value={15}>15 phút</option>
                  <option value={20}>20 phút</option>
                  <option value={30}>30 phút</option>
                </select>
              </div>
            </div>

            {/* Select Questions from Bank */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-slate-700">
                  Chọn câu hỏi cho đề thi ({selectedQuestionsForExam.length} câu đã chọn):
                </label>
                <span className="text-[11px] font-bold text-indigo-600">
                  Đã bao gồm Trắc nghiệm, Điền từ, Tự luận
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50">
                {questions.map((q) => {
                  const isChecked = selectedQuestionsForExam.includes(q.id);
                  return (
                    <label
                      key={q.id}
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                        isChecked ? 'bg-indigo-50/80 border-indigo-400 font-bold' : 'bg-white border-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedQuestionsForExam((prev) => [...prev, q.id]);
                          } else {
                            setSelectedQuestionsForExam((prev) => prev.filter((id) => id !== q.id));
                          }
                        }}
                        className="mt-1 rounded text-indigo-600"
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-200 text-slate-700">
                            {q.type === 'multiple_choice' && 'Trắc nghiệm'}
                            {q.type === 'fill_in_blank' && 'Điền từ'}
                            {q.type === 'short_answer' && 'Tự luận'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-bold">{q.topicName}</span>
                        </div>
                        <p className="text-slate-800">{q.question}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-200 transition"
            >
              Phát hành phòng thi cho {currentClass?.name || 'cả lớp'} 🚀
            </button>
          </form>
        </div>
      )}

      {/* ================= TAB: QUẢN LÝ TÀI KHOẢN HỌC SINH ================= */}
      {activeTab === 'accounts' && (
        <StudentAccountManager />
      )}

      {/* ================= TAB 3: QUẢN LÝ HỌC SINH (EXCEL & HỒ SƠ CHI TIẾT) ================= */}
      {activeTab === 'students' && (
        <StudentRosterView />
      )}

      {/* ================= TAB 4: QUẢN LÝ CÁC LỚP HỌC (MULTI-CLASS) ================= */}
      {activeTab === 'classes' && (
        <div className="space-y-6 animate-pop">
          <div className="bg-white rounded-3xl p-6 border-3 border-indigo-100 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Danh Sách Các Lớp Học Đang Phụ Trách
                </h2>
                <p className="text-xs text-slate-500 font-semibold">
                  Mỗi lớp có danh sách học sinh, bài tập đã giao và phòng thi hoàn toàn độc lập
                </p>
              </div>

              <button
                onClick={() => setIsCreateClassModalOpen(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tạo Lớp Mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacherClasses.map((cls) => {
                const isActive = currentClass?.id === cls.id;
                const studentListInCls = allStudents.filter(
                  (s) => s.classCode.toUpperCase() === cls.classCode.toUpperCase()
                );

                return (
                  <div
                    key={cls.id}
                    className={`rounded-2xl p-5 border-2 transition ${
                      isActive
                        ? 'bg-indigo-50/70 border-indigo-500 shadow-md'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-[10px] font-black uppercase">
                          Mã: {cls.classCode}
                        </div>
                        <h3 className="text-base font-black text-slate-900 mt-1">{cls.name}</h3>
                      </div>
                      {isActive && (
                        <span className="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg">
                          Đang chọn
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 mb-4">
                      <div>
                        <strong>Năm học:</strong> {cls.academicYear}
                      </div>
                      <div>
                        <strong>Trường:</strong> {cls.schoolName || currentTeacher?.schoolName}
                      </div>
                      <div>
                        <strong>Sĩ số hiện tại:</strong>{' '}
                        <span className="font-black text-indigo-700">{studentListInCls.length} học sinh</span>
                      </div>
                      {cls.description && (
                        <div className="text-[11px] text-slate-400 italic">{cls.description}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      {!isActive ? (
                        <button
                          onClick={() => switchActiveClass(cls.id)}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition"
                        >
                          Chọn lớp làm việc
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveTab('students')}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition"
                        >
                          Xem danh sách học sinh
                        </button>
                      )}

                      <button
                        onClick={() => setEditingClass(cls)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                        title="Đổi tên / chỉnh sửa thông tin lớp"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB: GIAO BÀI TẬP SGK KẾT NỐI TRI THỨC ================= */}
      {activeTab === 'homework' && (
        <div className="space-y-6">
          <CurriculumTeacherManager />
        </div>
      )}

      {/* ================= TAB 5: SOẠN CÂU HỎI BẰNG AI ================= */}
      {activeTab === 'ai_creator' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border-3 border-amber-200 shadow-md">
            <div className="flex items-center gap-2 font-black text-lg text-slate-900 mb-1">
              <Bot className="w-5 h-5 text-amber-600" />
              <span>Trợ Lý AI Tạo Câu Hỏi Cho Giáo Viên</span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mb-6">
              AI sẽ tạo các câu hỏi bám sát chuẩn kiến thức lớp 2. <strong>Giáo viên phải duyệt</strong> trước khi câu hỏi được thêm vào ngân hàng cho học sinh làm.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Môn học:</label>
                <select
                  value={aiSubject}
                  onChange={(e) => setAiSubject(e.target.value as Subject)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="math">Toán Lớp 2 📐</option>
                  <option value="vietnamese">Tiếng Việt Lớp 2 📖</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Chủ đề:</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Mức độ:</label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value as Difficulty)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="easy">Khởi động (Dễ ⭐)</option>
                  <option value="medium">Tăng tốc (Trung bình ⭐⭐)</option>
                  <option value="hard">Về đích (Thử thách ⭐⭐⭐)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleGenerateAIQuestions}
                  disabled={isGeneratingAI}
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-slate-900 font-black text-xs rounded-xl shadow-md transition"
                >
                  {isGeneratingAI ? 'AI đang soạn...' : 'Tạo câu hỏi bằng AI 🚀'}
                </button>
              </div>
            </div>
          </div>

          {/* AI Questions Review & Approval Queue */}
          {aiQuestionsQueue.length > 0 && (
            <div className="bg-amber-50/60 border-2 border-amber-300 rounded-3xl p-6">
              <h3 className="font-black text-slate-900 text-base mb-1 flex items-center gap-2">
                <span>📋 Hàng Chờ Duyệt Nội Dung AI ({aiQuestionsQueue.length} câu)</span>
              </h3>
              <p className="text-xs font-semibold text-amber-900 mb-4">
                Kiểm tra kỹ nội dung, chỉnh sửa nếu cần rồi nhấn &quot;Duyệt & Thêm vào ngân hàng&quot;.
              </p>

              <div className="space-y-4">
                {aiQuestionsQueue.map((q, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs">
                    <div className="text-xs font-black text-slate-800 mb-2">
                      Câu {idx + 1}: {q.question}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {(q.options || []).map((opt, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded-lg text-xs font-semibold border ${
                            opt === q.correctAnswer
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}. {opt} {opt === q.correctAnswer && '✅ (Đáp án đúng)'}
                        </div>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-500 mb-3">
                      💡 <strong>Gợi ý:</strong> {q.hint}
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setAiQuestionsQueue((prev) => prev.filter((_, i) => i !== idx));
                          soundFx.playClick();
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg border border-rose-200"
                      >
                        Loại bỏ
                      </button>
                      <button
                        onClick={() => {
                          teacherAddQuestion(q);
                          setAiQuestionsQueue((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg shadow-sm"
                      >
                        Duyệt & Giao bài 🌟
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 6: THỐNG KÊ LỖI SAI & AI SƯ PHẠM ================= */}
      {activeTab === 'mistakes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border-3 border-slate-100 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Phân Tích Các Dạng Lỗi Sai Thường Gặp - {currentClass?.name || 'Lớp Học'}
                </h2>
                <p className="text-xs text-slate-500 font-semibold">
                  Thống kê các chủ đề học sinh nhầm lẫn nhiều nhất trong tuần
                </p>
              </div>

              <button
                onClick={handleAnalyzeMistakesAI}
                disabled={isLoadingPedagogy}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2"
              >
                <BrainCircuit className="w-4 h-4" />
                <span>{isLoadingPedagogy ? 'Đang phân tích...' : 'AI Phân Tích Sư Phạm'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {mistakeStats.map((item, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800">{item.topic}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                      Tỉ lệ sai: {item.mistakeRate}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">
                    <strong>Vấn đề:</strong> {item.commonIssue}
                  </p>
                  <p className="text-xs text-indigo-700 font-semibold bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                    💡 <strong>Gợi ý đứng lớp:</strong> {item.suggestedAction}
                  </p>
                </div>
              ))}
            </div>

            {/* AI Pedagogy Report Box */}
            {aiPedagogyAnalysis && (
              <div className="p-5 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl animate-pop">
                <h3 className="font-black text-sm text-indigo-950 mb-2 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-600" />
                  <span>Báo Cáo Tư Vấn Sư Phạm Từ AI:</span>
                </h3>
                <div className="text-xs font-semibold text-slate-800 whitespace-pre-line leading-relaxed">
                  {aiPedagogyAnalysis}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: TẠO LỚP HỌC MỚI ================= */}
      {isCreateClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-pop">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-indigo-300 relative">
            <button
              onClick={() => setIsCreateClassModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <School className="w-5 h-5 text-indigo-600" />
              <span>Tạo Lớp Học Mới</span>
            </h3>
            <p className="text-xs text-slate-500 font-semibold mb-4">
              Lớp mới sẽ thuộc quyền quản lý của thầy cô {currentTeacher?.name}
            </p>

            {classActionError && (
              <div className="p-3 mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl text-center">
                {classActionError}
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Mã lớp *:</label>
                  <input
                    type="text"
                    value={newClassCode}
                    onChange={(e) => setNewClassCode(e.target.value.toUpperCase())}
                    placeholder="VD: 2A5"
                    className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-black text-sm uppercase text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Tên lớp:</label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="VD: Lớp 2A5"
                    className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Năm học:</label>
                <input
                  type="text"
                  value={newClassYear}
                  onChange={(e) => setNewClassYear(e.target.value)}
                  placeholder="2024 - 2025"
                  className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Ghi chú mô tả:</label>
                <input
                  type="text"
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                  placeholder="Ví dụ: Lớp bán trú, lớp chuyên đề..."
                  className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateClassModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md"
                >
                  Tạo lớp ngay 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CHỈNH SỬA THÔNG TIN LỚP ================= */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-pop">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-indigo-300 relative">
            <button
              onClick={() => setEditingClass(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <Edit className="w-5 h-5 text-indigo-600" />
              <span>Chỉnh Sửa Lớp: {editingClass.name}</span>
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateClassInfo(editingClass.id, {
                  name: editingClass.name,
                  academicYear: editingClass.academicYear,
                  description: editingClass.description,
                });
                setEditingClass(null);
              }}
              className="space-y-3.5 mt-4"
            >
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Tên lớp:</label>
                <input
                  type="text"
                  value={editingClass.name}
                  onChange={(e) =>
                    setEditingClass({ ...editingClass, name: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-sm text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Năm học:</label>
                <input
                  type="text"
                  value={editingClass.academicYear}
                  onChange={(e) =>
                    setEditingClass({ ...editingClass, academicYear: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Mô tả / Ghi chú:</label>
                <input
                  type="text"
                  value={editingClass.description || ''}
                  onChange={(e) =>
                    setEditingClass({ ...editingClass, description: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: HỒ SƠ GIÁO VIÊN & ĐỔI MẬT KHẨU ================= */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-pop">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl border-4 border-indigo-300 relative">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-indigo-600" />
              <span>Hồ Sơ Giáo Viên & Bảo Mật</span>
            </h3>
            <p className="text-xs text-slate-500 font-semibold mb-5">
              Cập nhật thông tin định danh và đổi mật khẩu an toàn
            </p>

            {/* Profile Section */}
            <form onSubmit={handleSaveProfile} className="space-y-3.5 mb-6 pb-6 border-b border-slate-200">
              <h4 className="text-xs font-black uppercase text-indigo-700">1. Thông tin cá nhân</h4>

              {profileSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center">
                  {profileSuccess}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="text-xs font-black text-slate-700 block mb-1">Họ và tên:</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs sm:text-sm text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Ảnh đại diện:</label>
                  <select
                    value={profileAvatar}
                    onChange={(e) => setProfileAvatar(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-lg text-center"
                  >
                    <option value="👩‍🏫">👩‍🏫</option>
                    <option value="👨‍🏫">👨‍🏫</option>
                    <option value="🧑‍🏫">🧑‍🏫</option>
                    <option value="🌟">🌟</option>
                    <option value="📚">📚</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Chức danh / Vai trò:</label>
                <input
                  type="text"
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value)}
                  placeholder="Ví dụ: Giáo viên Chủ nhiệm, Tổ trưởng Chuyên môn"
                  className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-semibold text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Trường tiểu học:</label>
                <input
                  type="text"
                  value={profileSchool}
                  onChange={(e) => setProfileSchool(e.target.value)}
                  placeholder="Ví dụ: Tiểu học Chu Văn An"
                  className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-semibold text-xs text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition"
              >
                Lưu thông tin cá nhân
              </button>
            </form>

            {/* Password Section */}
            <form onSubmit={handleChangePassword} className="space-y-3">
              <h4 className="text-xs font-black uppercase text-amber-700 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>2. Đổi mật khẩu tài khoản</span>
              </h4>

              {passwordError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl text-center">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center">
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Mật khẩu hiện tại:</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu cũ (thử: 123)"
                  className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Mật khẩu mới:</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mật khẩu mới"
                    className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Xác nhận mật khẩu:</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-black text-xs rounded-xl shadow-xs transition"
              >
                Cập nhật mật khẩu mới 🔑
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
