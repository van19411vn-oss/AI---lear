import React, { useState, useMemo } from 'react';
import { Subject } from '../../types';
import { CurriculumVolume, CurriculumLesson, CurriculumTheme } from '../../types/curriculum';
import {
  getLessonsBySubjectAndVolume,
  getThemesBySubjectAndVolume,
  MATH_LESSONS,
  VIET_LESSONS,
} from '../../data/curriculumData';
import { useApp } from '../../context/AppContext';
import { MathLessonPlayer } from './MathLessonPlayer';
import { VietnameseLessonPlayer } from './VietnameseLessonPlayer';
import { soundFx } from '../../utils/sound';
import {
  BookOpen,
  Calculator,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Award,
  Star,
  Clock,
  Layers,
  ChevronRight,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const CurriculumExplorer: React.FC = () => {
  const { currentStudent, currentTeacher, currentClass, studentLessonResults, assignedHomeworks } = useApp();

  const [selectedSubject, setSelectedSubject] = useState<Subject>('math');
  const [selectedVolume, setSelectedVolume] = useState<CurriculumVolume>(1);
  const [selectedLesson, setSelectedLesson] = useState<CurriculumLesson | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'uncompleted'>('all');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('all');

  // Load themes and lessons based on subject & volume
  const themes = useMemo(
    () => getThemesBySubjectAndVolume(selectedSubject, selectedVolume),
    [selectedSubject, selectedVolume]
  );

  const lessons = useMemo(
    () => getLessonsBySubjectAndVolume(selectedSubject, selectedVolume),
    [selectedSubject, selectedVolume]
  );

  // Check which lessons have been completed by current student
  const completedLessonIds = useMemo(() => {
    if (!currentStudent) return new Set<string>();
    const ids = studentLessonResults
      .filter((r) => r.studentId === currentStudent.id)
      .map((r) => r.lessonId);
    return new Set(ids);
  }, [currentStudent, studentLessonResults]);

  // Homework assigned to student
  const studentHomeworks = useMemo(() => {
    if (!currentStudent) return [];
    return assignedHomeworks.filter(
      (hw) =>
        hw.targetType === 'all' ||
        hw.targetStudentIds.includes(currentStudent.id)
    );
  }, [assignedHomeworks, currentStudent]);

  // Filter lessons
  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      const matchSearch =
        l.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        l.themeName.toLowerCase().includes(searchQuery.toLowerCase().trim());
      if (!matchSearch) return false;

      if (selectedThemeId !== 'all' && l.themeId !== selectedThemeId) return false;

      const isDone = completedLessonIds.has(l.id);
      if (statusFilter === 'completed' && !isDone) return false;
      if (statusFilter === 'uncompleted' && isDone) return false;

      return true;
    });
  }, [lessons, searchQuery, selectedThemeId, statusFilter, completedLessonIds]);

  // If a lesson is actively open in player mode
  if (selectedLesson) {
    if (selectedSubject === 'math') {
      return (
        <MathLessonPlayer
          lesson={selectedLesson}
          onBack={() => {
            setSelectedLesson(null);
            soundFx.playClick();
          }}
        />
      );
    } else {
      return (
        <VietnameseLessonPlayer
          lesson={selectedLesson}
          onBack={() => {
            setSelectedLesson(null);
            soundFx.playClick();
          }}
        />
      );
    }
  }

  return (
    <div className="space-y-6 animate-pop">
      {/* Subject & Volume Selection Hero Banner (Phần 1) */}
      <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-sky-400 rounded-3xl p-6 sm:p-7 shadow-lg border-3 border-amber-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/70 backdrop-blur-sm text-xs font-black uppercase text-amber-950 mb-1 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Chương Trình Chuẩn Lớp 2 • Bộ Sách Kết Nối Tri Thức
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Trạm Học Tập Toán & Tiếng Việt Lớp 2
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
              Học theo cấu trúc: <strong>Chủ đề → Bài học → Hoạt động học tập → Kết quả</strong>
            </p>
          </div>

          {/* Volume Switcher: Tập 1 & Tập 2 */}
          <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-2xl border-2 border-amber-200 shadow-sm">
            <span className="text-xs font-black text-slate-600 pl-2">Chọn Tập:</span>
            <button
              onClick={() => {
                setSelectedVolume(1);
                soundFx.playClick();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                selectedVolume === 1
                  ? 'bg-blue-600 text-white shadow-md scale-102'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              📗 Tập 1
            </button>
            <button
              onClick={() => {
                setSelectedVolume(2);
                soundFx.playClick();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                selectedVolume === 2
                  ? 'bg-blue-600 text-white shadow-md scale-102'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              📘 Tập 2
            </button>
          </div>
        </div>

        {/* Subject Switcher: 1. Toán lớp 2 & 2. Tiếng Việt lớp 2 */}
        <div className="grid grid-cols-2 gap-3 max-w-lg">
          <button
            onClick={() => {
              setSelectedSubject('math');
              soundFx.playClick();
            }}
            className={`p-4 rounded-2xl border-3 flex items-center gap-3 transition-all duration-200 ${
              selectedSubject === 'math'
                ? 'bg-white border-blue-600 shadow-md scale-102'
                : 'bg-white/60 border-transparent hover:bg-white text-slate-700'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-2xl shadow-xs">
              🧮
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-500 uppercase">Môn học 1</div>
              <div className="text-base sm:text-lg font-black text-slate-900">Toán Lớp 2</div>
            </div>
          </button>

          <button
            onClick={() => {
              setSelectedSubject('vietnamese');
              soundFx.playClick();
            }}
            className={`p-4 rounded-2xl border-3 flex items-center gap-3 transition-all duration-200 ${
              selectedSubject === 'vietnamese'
                ? 'bg-white border-blue-600 shadow-md scale-102'
                : 'bg-white/60 border-transparent hover:bg-white text-slate-700'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center text-2xl shadow-xs">
              📖
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-500 uppercase">Môn học 2</div>
              <div className="text-base sm:text-lg font-black text-slate-900">Tiếng Việt Lớp 2</div>
            </div>
          </button>
        </div>
      </div>

      {/* Homework Assigned by Teacher (Phần 7 & 8: Liên kết bài tập cô giao) */}
      {studentHomeworks.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-black text-xs text-rose-900 uppercase">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Nhiệm vụ {currentTeacher?.name ? currentTeacher.name : 'thầy cô'} giao cho con ({studentHomeworks.length} bài)</span>
            </div>
            <span className="text-[11px] font-bold text-rose-700">{currentClass?.name || 'Lớp 2'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {studentHomeworks.map((hw) => {
              const isSub = (hw.submissions || []).some((s) => s.studentId === currentStudent?.id);
              return (
                <div
                  key={hw.id}
                  className="bg-white p-3.5 rounded-2xl border border-rose-200 flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <div className="font-black text-slate-900 text-xs sm:text-sm">{hw.lessonTitle}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-semibold">
                      Hạn nộp: <strong className="text-rose-600">{hw.dueDate}</strong> • Mức độ:{' '}
                      {hw.level === 'basic' ? 'Cơ bản' : hw.level === 'reinforce' ? 'Củng cố' : 'Nâng cao'}
                    </div>
                  </div>

                  <div>
                    {isSub ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-black text-xs rounded-xl flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã làm ✅</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          const target = [...MATH_LESSONS, ...VIET_LESSONS].find((l) => l.id === hw.lessonId);
                          if (target) {
                            setSelectedLesson(target);
                            setSelectedSubject(target.subject);
                            setSelectedVolume(target.volume);
                          }
                        }}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition"
                      >
                        Làm ngay 🚀
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls: Search, Theme Selector & Status Filter */}
      <div className="bg-white rounded-3xl p-5 border-3 border-slate-100 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Tìm bài học ${selectedSubject === 'math' ? 'Toán' : 'Tiếng Việt'} (VD: Tia số, Bài 1)...`}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Theme Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedThemeId}
              onChange={(e) => setSelectedThemeId(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-hidden"
            >
              <option value="all">Tất cả chủ đề</option>
              {themes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-black">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  statusFilter === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStatusFilter('uncompleted')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  statusFilter === 'uncompleted' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Chưa học
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  statusFilter === 'completed' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Đã học ✅
              </button>
            </div>
          </div>
        </div>

        {/* Breadcrumb info */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 pt-2 border-t border-slate-100">
          <span>{selectedSubject === 'math' ? '🧮 Môn Toán' : '📖 Môn Tiếng Việt'}</span>
          <span>&gt;</span>
          <span>Tập {selectedVolume}</span>
          <span>&gt;</span>
          <span className="text-slate-700 font-black">{filteredLessons.length} bài học theo chuẩn SGK</span>
        </div>
      </div>

      {/* Lesson Grid (Phần 2: Danh mục bài học chính xác theo SGK) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLessons.map((lesson) => {
          const isCompleted = completedLessonIds.has(lesson.id);

          return (
            <div
              key={lesson.id}
              className={`rounded-3xl p-5 border-3 transition-all duration-200 bg-white shadow-md hover:shadow-lg flex flex-col justify-between ${
                isCompleted ? 'border-emerald-300' : 'border-slate-100 hover:border-amber-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center">
                      #{lesson.lessonNumber}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {lesson.themeName.split(':')[0]}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {lesson.isVerified ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                        Chuẩn SGK
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold">
                        Đang hoàn thiện
                      </span>
                    )}

                    {isCompleted && (
                      <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-black">
                        Đã học ✅
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-900 mb-2 leading-snug">
                  {lesson.title}
                </h3>

                <p className="text-xs font-semibold text-slate-600 line-clamp-2 mb-3">
                  {lesson.learningGoals[0]}
                </p>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {lesson.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Start learning button (Phần 6) */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-400">
                  {selectedSubject === 'math' ? '6 hoạt động học tập' : 'Đọc hiểu & bài tập'}
                </span>

                <button
                  onClick={() => {
                    setSelectedLesson(lesson);
                    soundFx.playClick();
                  }}
                  className={`px-5 py-2.5 rounded-2xl font-black text-xs shadow-md transition flex items-center gap-1.5 active:scale-95 ${
                    isCompleted
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                  }`}
                >
                  <span>{isCompleted ? 'Học lại bài này 🔄' : 'Bắt đầu học ngay 🚀'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLessons.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border-2 border-slate-200 p-6">
          <span className="text-4xl">🔍</span>
          <h3 className="text-base font-black text-slate-900 mt-2">Không tìm thấy bài học phù hợp</h3>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Bé thử đổi từ khóa tìm kiếm hoặc chọn chủ đề khác xem sao nhé!
          </p>
        </div>
      )}
    </div>
  );
};
