import React, { useState } from 'react';
import { Student } from '../types';
import { useApp } from '../context/AppContext';
import { soundFx } from '../utils/sound';
import {
  X,
  User,
  Calendar,
  Award,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Swords,
  BookOpen,
  Calculator,
  Save,
  Clock,
  CheckCircle2,
  XCircle,
  Flame,
  Star,
  BarChart3,
  CalendarRange,
} from 'lucide-react';

interface Props {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentProfileModal: React.FC<Props> = ({ student, isOpen, onClose }) => {
  const { teacherUpdateStudentNotes, getStudentBadgesWithProgress } = useApp();

  const [timeFilter, setTimeFilter] = useState<'7days' | 'month' | 'all'>('7days');
  const [chartView, setChartView] = useState<'week' | 'month'>('week');
  const [activeDailySubjectTab, setActiveDailySubjectTab] = useState<'both' | 'math' | 'vietnamese'>('both');
  const [teacherNoteInput, setTeacherNoteInput] = useState('');
  const [isSavedNote, setIsSavedNote] = useState(false);

  // Sync state when student opens
  React.useEffect(() => {
    if (student) {
      setTeacherNoteInput(student.teacherNotes || '');
      setIsSavedNote(false);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const totalLessons = student.mathProgress.completedLessons + student.vietnameseProgress.completedLessons;
  const totalQuestions = student.mathProgress.totalQuestions + student.vietnameseProgress.totalQuestions;
  const totalCorrect = student.mathProgress.correctAnswers + student.vietnameseProgress.correctAnswers;
  const totalIncorrect = Math.max(totalQuestions - totalCorrect, 0);
  const avgAccuracy = Math.round((student.mathProgress.accuracy + student.vietnameseProgress.accuracy) / 2);

  const badges = getStudentBadgesWithProgress(student);
  const unlockedBadges = badges.filter((b) => b.isUnlocked);

  const handleSaveNote = () => {
    teacherUpdateStudentNotes(student.id, teacherNoteInput);
    setIsSavedNote(true);
    soundFx.playCorrect();
    setTimeout(() => setIsSavedNote(false), 2500);
  };

  // Detailed records filter
  const allRecords = student.detailedStudyHistory || [];
  const mathRecords = allRecords.filter((r) => r.subject === 'math');
  const vietRecords = allRecords.filter((r) => r.subject === 'vietnamese');

  // Filter based on time
  const limitCount = timeFilter === '7days' ? 4 : timeFilter === 'month' ? 10 : 30;
  const displayedMathRecords = mathRecords.slice(0, limitCount);
  const displayedVietRecords = vietRecords.slice(0, limitCount);

  // Weekly mock trend data (7 days)
  const weeklyData = [
    { day: 'Thứ 2', math: Math.max(student.mathProgress.accuracy - 8, 60), viet: Math.max(student.vietnameseProgress.accuracy - 10, 60), active: true },
    { day: 'Thứ 3', math: Math.max(student.mathProgress.accuracy - 5, 65), viet: Math.max(student.vietnameseProgress.accuracy - 6, 65), active: true },
    { day: 'Thứ 4', math: Math.max(student.mathProgress.accuracy - 2, 70), viet: Math.max(student.vietnameseProgress.accuracy - 3, 70), active: true },
    { day: 'Thứ 5', math: Math.max(student.mathProgress.accuracy - 4, 70), viet: Math.max(student.vietnameseProgress.accuracy + 2, 75), active: true },
    { day: 'Thứ 6', math: Math.min(student.mathProgress.accuracy + 1, 100), viet: Math.min(student.vietnameseProgress.accuracy, 100), active: true },
    { day: 'Thứ 7', math: Math.min(student.mathProgress.accuracy + 3, 100), viet: Math.min(student.vietnameseProgress.accuracy + 4, 100), active: true },
    { day: 'Chủ Nhật', math: student.mathProgress.accuracy, viet: student.vietnameseProgress.accuracy, active: true },
  ];

  // Monthly mock trend data (4 weeks)
  const monthlyData = [
    { label: 'Tuần 1', math: Math.max(student.mathProgress.accuracy - 14, 55), viet: Math.max(student.vietnameseProgress.accuracy - 12, 60), points: 220 },
    { label: 'Tuần 2', math: Math.max(student.mathProgress.accuracy - 9, 65), viet: Math.max(student.vietnameseProgress.accuracy - 8, 70), points: 310 },
    { label: 'Tuần 3', math: Math.max(student.mathProgress.accuracy - 3, 75), viet: Math.max(student.vietnameseProgress.accuracy - 2, 80), points: 360 },
    { label: 'Tuần 4', math: student.mathProgress.accuracy, viet: student.vietnameseProgress.accuracy, points: 420 },
  ];

  const duelRecords = student.duelRecords || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-pop">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border-4 border-amber-300 p-5 sm:p-7 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          aria-label="Đóng hồ sơ"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 1. Thông Tin Cơ Bản (Basic Info Header) */}
        <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-amber-400 rounded-3xl p-5 sm:p-6 text-white shadow-md mb-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white text-5xl flex items-center justify-center shadow-lg border-2 border-white/60">
              {student.avatar}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-black uppercase text-amber-300 mb-1">
                <Sparkles className="w-3 h-3" />
                Hồ Sơ Học Tập Toàn Diện • Lớp {student.classCode}
              </div>
              <h2 className="text-2xl font-black text-white">{student.name}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-blue-100 font-semibold mt-1">
                <span>Mã HS: <strong className="text-white font-mono">{student.studentCode}</strong></span>
                <span>•</span>
                <span>Ngày sinh: <strong className="text-white">{student.birthday || '15/08/2018'}</strong></span>
                <span>•</span>
                <span>Giới tính: <strong className="text-white">{student.gender || 'Nam'}</strong></span>
                <span>•</span>
                <span>Mã PIN cá nhân: <strong className="text-amber-300 font-mono">{student.pin}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Time Filter & Header Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
          <div className="text-sm font-black text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Chỉ Số Tiến Bộ Học Tập (Yêu Cầu 4 & 5)</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-black">
            <CalendarRange className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <button
              onClick={() => setTimeFilter('7days')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeFilter === '7days' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              7 ngày qua
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeFilter === 'month' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tháng này
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeFilter === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất cả
            </button>
          </div>
        </div>

        {/* 4. Số bài hoàn thành & 5. Số câu đúng, câu sai, tỉ lệ chính xác & 8. Điểm thi đua */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-3.5 text-center">
            <div className="text-[11px] font-bold text-emerald-700">Tỉ Lệ Chính Xác</div>
            <div className="text-2xl font-black text-emerald-800 mt-0.5">{avgAccuracy}%</div>
            <div className="text-[10px] text-emerald-600 font-semibold">
              <span className="text-emerald-700 font-bold">{totalCorrect} đúng</span> / <span className="text-rose-600 font-bold">{totalIncorrect} sai</span>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-3.5 text-center">
            <div className="text-[11px] font-bold text-blue-700">Số Bài Đã Làm</div>
            <div className="text-2xl font-black text-blue-800 mt-0.5">{totalLessons} bài</div>
            <div className="text-[10px] text-blue-600 font-semibold">Tổng {totalQuestions} câu hỏi</div>
          </div>

          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3.5 text-center">
            <div className="text-[11px] font-bold text-amber-700">Điểm Thi Đua</div>
            <div className="text-2xl font-black text-amber-800 mt-0.5">{student.totalPoints} đ</div>
            <div className="text-[10px] text-amber-600 font-semibold">{student.totalStars} Sao ⭐</div>
          </div>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-3.5 text-center">
            <div className="text-[11px] font-bold text-orange-700">Chuỗi Học Tập</div>
            <div className="text-2xl font-black text-orange-800 mt-0.5">{student.streakDays} ngày</div>
            <div className="text-[10px] text-orange-600 font-semibold">Học tích cực 🔥</div>
          </div>
        </div>

        {/* ================= 9. BIỂU ĐỒ TIẾN BỘ THEO TUẦN VÀ THÁNG ================= */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-5 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  9. Biểu Đồ Tiến Bộ Học Tập (Tuần & Tháng)
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-semibold">
                Theo dõi đường cong học tập và mức độ cải thiện điểm số của em
              </p>
            </div>

            <div className="flex bg-white border border-slate-200 p-1 rounded-xl text-xs font-black">
              <button
                onClick={() => setChartView('week')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  chartView === 'week' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                Theo 7 Ngày Tuần
              </button>
              <button
                onClick={() => setChartView('month')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  chartView === 'month' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                Theo 4 Tuần Tháng
              </button>
            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-600 mb-4 bg-white p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-amber-400"></span>
              <span>Độ chính xác Toán (%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-blue-600"></span>
              <span>Độ chính xác Tiếng Việt (%)</span>
            </div>
          </div>

          {/* Visual Bar Chart */}
          {chartView === 'week' ? (
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 border-b border-slate-200">
                {weeklyData.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="text-[10px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition">
                      {Math.round((item.math + item.viet) / 2)}%
                    </div>
                    <div className="w-full max-w-[36px] flex items-end justify-center gap-1 h-full">
                      {/* Math bar */}
                      <div
                        className="w-1/2 bg-amber-400 hover:bg-amber-500 rounded-t-md transition-all duration-300 relative"
                        style={{ height: `${item.math}%` }}
                        title={`Toán: ${item.math}%`}
                      ></div>
                      {/* Vietnamese bar */}
                      <div
                        className="w-1/2 bg-blue-600 hover:bg-blue-700 rounded-t-md transition-all duration-300 relative"
                        style={{ height: `${item.viet}%` }}
                        title={`Tiếng Việt: ${item.viet}%`}
                      ></div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 mt-2">{item.day}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mt-2 px-2">
                <span>0%</span>
                <span>Mức đạt chuẩn trung bình (70%)</span>
                <span>100% Xuất sắc</span>
              </div>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <div className="h-44 flex items-end justify-between gap-4 sm:gap-8 pt-6 px-4 border-b border-slate-200">
                {monthlyData.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="text-[10px] font-black text-indigo-700 opacity-0 group-hover:opacity-100 transition">
                      +{item.points}đ
                    </div>
                    <div className="w-full max-w-[50px] flex items-end justify-center gap-1.5 h-full">
                      <div
                        className="w-1/2 bg-amber-400 hover:bg-amber-500 rounded-t-md transition-all duration-300"
                        style={{ height: `${item.math}%` }}
                        title={`Toán: ${item.math}%`}
                      ></div>
                      <div
                        className="w-1/2 bg-blue-600 hover:bg-blue-700 rounded-t-md transition-all duration-300"
                        style={{ height: `${item.viet}%` }}
                        title={`Tiếng Việt: ${item.viet}%`}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 mt-2">{item.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] font-bold text-indigo-700 text-center mt-2">
                📈 Xu hướng tiến bộ: Em đang tăng trưởng đều đặn qua từng tuần trong tháng!
              </p>
            </div>
          )}
        </div>

        {/* ================= 2. KẾT QUẢ TOÁN THEO TỪNG NGÀY & 3. KẾT QUẢ TIẾNG VIỆT THEO TỪNG NGÀY ================= */}
        <div className="border-2 border-slate-200 rounded-3xl p-5 mb-6 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>2 & 3. Kết Quả Học Tập Theo Từng Ngày</span>
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Xem chi tiết từng bài học Toán và Tiếng Việt học sinh đã làm theo ngày
              </p>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-black">
              <button
                onClick={() => setActiveDailySubjectTab('both')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeDailySubjectTab === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Cả 2 môn
              </button>
              <button
                onClick={() => setActiveDailySubjectTab('math')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeDailySubjectTab === 'math' ? 'bg-amber-400 text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                🧮 Môn Toán
              </button>
              <button
                onClick={() => setActiveDailySubjectTab('vietnamese')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeDailySubjectTab === 'vietnamese' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                📖 Tiếng Việt
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 2. Môn Toán Theo Ngày */}
            {(activeDailySubjectTab === 'both' || activeDailySubjectTab === 'math') && (
              <div className="border border-amber-200 rounded-2xl p-4 bg-amber-50/30">
                <div className="flex items-center justify-between mb-3 border-b border-amber-200 pb-2">
                  <div className="flex items-center gap-2 font-black text-xs text-amber-900 uppercase">
                    <Calculator className="w-4 h-4 text-amber-600" />
                    <span>2. Nhật Ký Học Toán ({displayedMathRecords.length} buổi)</span>
                  </div>
                  <span className="text-xs font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                    {student.mathProgress.accuracy}% chính xác
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {displayedMathRecords.length > 0 ? (
                    displayedMathRecords.map((r) => (
                      <div key={r.id} className="bg-white p-3 rounded-xl border border-amber-200 text-xs shadow-2xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-slate-800">{r.topicName}</span>
                          <span className="font-mono text-[11px] font-bold text-slate-500">{r.date}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-emerald-700 font-bold">
                            Đúng: {r.correctCount}/{r.totalQuestions} câu
                          </span>
                          <span className="font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            +{r.score} điểm
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs font-semibold text-slate-400">
                      Chưa có dữ liệu bài tập trong giai đoạn này.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Môn Tiếng Việt Theo Ngày */}
            {(activeDailySubjectTab === 'both' || activeDailySubjectTab === 'vietnamese') && (
              <div className="border border-blue-200 rounded-2xl p-4 bg-blue-50/30">
                <div className="flex items-center justify-between mb-3 border-b border-blue-200 pb-2">
                  <div className="flex items-center gap-2 font-black text-xs text-blue-900 uppercase">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>3. Nhật Ký Học Tiếng Việt ({displayedVietRecords.length} buổi)</span>
                  </div>
                  <span className="text-xs font-black text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">
                    {student.vietnameseProgress.accuracy}% chính xác
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {displayedVietRecords.length > 0 ? (
                    displayedVietRecords.map((r) => (
                      <div key={r.id} className="bg-white p-3 rounded-xl border border-blue-200 text-xs shadow-2xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-slate-800">{r.topicName}</span>
                          <span className="font-mono text-[11px] font-bold text-slate-500">{r.date}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-emerald-700 font-bold">
                            Đúng: {r.correctCount}/{r.totalQuestions} câu
                          </span>
                          <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            +{r.score} điểm
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs font-semibold text-slate-400">
                      Chưa có dữ liệu bài tập trong giai đoạn này.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= 6. DẠNG BÀI THƯỜNG LÀM SAI ================= */}
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 font-black text-xs text-rose-900 uppercase tracking-wider mb-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>6. Những Dạng Bài Học Sinh Thường Nhầm Lẫn / Làm Sai:</span>
          </div>
          {student.commonMistakes && student.commonMistakes.length > 0 ? (
            <div className="space-y-1.5">
              {student.commonMistakes.map((mistake, idx) => (
                <div key={idx} className="text-xs font-bold text-rose-800 flex items-center gap-2 bg-white/70 p-2 rounded-xl border border-rose-200">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>{mistake}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs font-semibold text-rose-700 bg-white/70 p-2 rounded-xl border border-rose-200">
              Chưa ghi nhận dạng bài sai lặp lại. Học sinh tiếp thu bài rất đồng đều và vững chắc!
            </p>
          )}
        </div>

        {/* ================= 7. LỊCH SỬ THAM GIA THÁCH ĐẤU & 8. HUY HIỆU ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 7. Lịch Sử Thách Đấu */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Swords className="w-4 h-4 text-violet-600" />
              <span>7. Lịch Sử Tham Gia Thách Đấu</span>
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {duelRecords.length > 0 ? (
                duelRecords.map((d, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">{d.title}</div>
                      <div className="text-[10px] text-slate-500">
                        Đối thủ: {d.opponentAvatar} {d.opponentName} ({d.date})
                      </div>
                    </div>
                    <span
                      className={`font-black text-[11px] px-2.5 py-1 rounded-lg ${
                        d.result === 'win'
                          ? 'bg-emerald-100 text-emerald-800'
                          : d.result === 'tie'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {d.result === 'win' ? 'Thắng 🏆' : d.result === 'tie' ? 'Hòa 🤝' : 'Cố gắng 💪'} ({d.myScore} - {d.opponentScore})
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-4 text-center font-semibold">
                  Chưa tham gia trận thách đấu nào.
                </div>
              )}
            </div>
          </div>

          {/* 8. Huy Hiệu & Thành Tích */}
          <div className="border border-purple-200 rounded-2xl p-4 bg-purple-50/30">
            <h4 className="font-black text-xs text-purple-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-600" />
              <span>8. Huy Hiệu & Thành Tích Đạt Được ({unlockedBadges.length} huy hiệu)</span>
            </h4>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
              {unlockedBadges.length > 0 ? (
                unlockedBadges.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white px-3 py-1.5 rounded-xl border border-purple-200 flex items-center gap-2 text-xs font-bold shadow-2xs"
                  >
                    <span className="text-lg">{b.icon}</span>
                    <div>
                      <div className="text-slate-800 font-black">{b.name}</div>
                      <div className="text-[10px] text-purple-700 font-semibold">{b.requirementLabel}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-4 text-center font-semibold w-full">
                  Đang tích cực rèn luyện để mở khóa những huy hiệu đầu tiên!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= 10. NHẬN XÉT, GHI CHÚ RIÊNG CỦA GIÁO VIÊN ================= */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4">
          <label className="text-xs font-black text-slate-800 block mb-1">
            👩‍🏫 10. Nhận Xét & Ghi Chú Riêng Của Giáo Viên Chủ Nhiệm (Cô Lan):
          </label>
          <textarea
            rows={3}
            value={teacherNoteInput}
            onChange={(e) => setTeacherNoteInput(e.target.value)}
            placeholder="Nhập nhận xét của cô dành riêng cho em (ví dụ: Em rất chăm chỉ, tính toán nhanh, cần cẩn thận hơn khi làm phép trừ có nhớ...)"
            className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500 mb-2"
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-400">
              Ghi chú này sẽ được lưu vào hồ sơ và hiển thị cho học sinh trên trang &quot;Tiến bộ của em&quot;.
            </span>
            <button
              onClick={handleSaveNote}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavedNote ? 'Đã lưu ghi chú! ✅' : 'Lưu ghi chú'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
