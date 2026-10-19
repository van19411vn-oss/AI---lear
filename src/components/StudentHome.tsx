import React from 'react';
import { useApp } from '../context/AppContext';
import { soundFx } from '../utils/sound';
import {
  Sparkles,
  Flame,
  Award,
  BookOpen,
  Calculator,
  Bot,
  Swords,
  Trophy,
  ArrowRight,
  CheckCircle2,
  Heart,
  Star,
  ClipboardList,
  GraduationCap,
  User,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  onNavigate: (tabId: string) => void;
  onOpenLogin?: (role: 'student' | 'teacher') => void;
}

export const StudentHome: React.FC<Props> = ({ onNavigate, onOpenLogin }) => {
  const { currentStudent, currentClass, challenges, assignedHomeworks, currentRole } = useApp();

  const handleCardClick = (tabId: string) => {
    soundFx.playClick();
    onNavigate(tabId);
  };

  const pendingClassRoom = challenges.find((c) => c.type === 'class_room');
  const classCode = currentClass?.classCode || '2A10';
  const studentHomeworks = assignedHomeworks.filter(
    (hw) => !hw.classCode || hw.classCode.toUpperCase() === classCode.toUpperCase()
  );

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* 2 Clear Login Choices on Home Page (Phần 1: Yêu Cầu Đăng Nhập Trang Chủ) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-amber-300 shadow-md mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-300 flex items-center justify-center text-2xl shadow-sm select-none">
            🐝
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900 text-sm sm:text-base">
                Cổng Đăng Nhập AI LEARN
              </span>
              <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                {currentClass?.name || 'Khối 2'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Lựa chọn vai trò phù hợp để bắt đầu học tập và giảng dạy:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 w-full md:w-auto">
          <button
            onClick={() => {
              soundFx.playClick();
              if (onOpenLogin) onOpenLogin('student');
            }}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm active:scale-95 ${
              currentRole === 'student'
                ? 'bg-blue-600 text-white shadow-blue-200 ring-2 ring-blue-400'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>1. Đăng nhập Học sinh 🎒</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              if (onOpenLogin) onOpenLogin('teacher');
            }}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm active:scale-95 ${
              currentRole === 'teacher'
                ? 'bg-amber-500 text-slate-950 shadow-amber-200 ring-2 ring-amber-400'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-300'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>2. Đăng nhập Giáo viên 👩‍🏫</span>
          </button>
        </div>
      </div>
      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-amber-400 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-100 mb-8 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 text-9xl opacity-20 select-none hidden sm:block">
          🐝
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-black uppercase tracking-wider text-amber-300 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            {currentClass?.name || 'Khối 2'} • Trạm Học Tập Thông Minh
          </div>

          <h1 className="text-2xl sm:text-4xl font-black mb-2 leading-tight">
            Xin chào, {currentStudent?.name || 'bạn nhỏ'}! 🌟
          </h1>

          <p className="text-xs sm:text-sm font-semibold text-blue-100 mb-6 leading-relaxed">
            Thông điệp yêu thương: <strong>&quot;Mỗi em một lộ trình – Mỗi ngày một tiến bộ&quot;</strong>. Hôm nay chúng mình cùng học thật vui nhé!
          </p>

          {/* Quick status bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/25 backdrop-blur-sm px-3.5 py-1.5 rounded-2xl flex items-center gap-2 text-xs font-black">
              <span>⭐</span>
              <span>{currentStudent?.totalStars || 0} Ngôi sao</span>
            </div>

            <div className="bg-white/25 backdrop-blur-sm px-3.5 py-1.5 rounded-2xl flex items-center gap-2 text-xs font-black">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span>Chuỗi {currentStudent?.streakDays || 1} ngày chăm chỉ</span>
            </div>

            <div className="bg-white/25 backdrop-blur-sm px-3.5 py-1.5 rounded-2xl flex items-center gap-2 text-xs font-black">
              <span>🏆</span>
              <span>{currentStudent?.totalPoints || 0} Điểm thi đua</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Large Touchable Navigation Cards (Touch-friendly & Cartoon style) */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-slate-800">Trạm Học Tập & Vui Chơi</h2>
          <span className="text-xs font-bold text-slate-400">Chạm là mở ngay 👆</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Card 1: Học Toán */}
          <div
            onClick={() => handleCardClick('home')}
            className="bg-white rounded-3xl p-6 border-3 border-amber-200 hover:border-amber-400 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-3xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                🧮
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors mb-1">
                1. Học Toán Lớp 2
              </h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Phép cộng trừ có nhớ, bảng nhân chia 2 & 5, xem giờ đồng hồ và giải toán có lời văn.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-black text-amber-700">
              <span>Học Toán ngay</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Học Tiếng Việt */}
          <div
            onClick={() => handleCardClick('home')}
            className="bg-white rounded-3xl p-6 border-3 border-blue-200 hover:border-blue-400 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-100 border border-blue-300 flex items-center justify-center text-3xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                📖
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                2. Học Tiếng Việt 2
              </h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Từ chỉ sự vật, đặc điểm, câu Ai là gì? Ai làm gì? và phân biệt chính tả ch/tr, s/x.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-black text-blue-700">
              <span>Học Tiếng Việt ngay</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Bài Tập Cô Giao */}
          <div
            onClick={() => handleCardClick('home')}
            className="bg-white rounded-3xl p-6 border-3 border-rose-200 hover:border-rose-400 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-3xl shadow-sm mb-4 group-hover:scale-110 transition-transform relative">
                📝
                {studentHomeworks.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs animate-bounce">
                    {studentHomeworks.length}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-rose-600 transition-colors mb-1">
                3. Bài Tập Cô Giao
              </h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Nhiệm vụ theo bộ sách Kết nối tri thức được cô giáo giao riêng cho học sinh lớp {classCode}.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-black text-rose-700">
              <span>{studentHomeworks.length} nhiệm vụ chờ làm</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Luyện Tập Cùng AI */}
          <div
            onClick={() => handleCardClick('ai-bot')}
            className="bg-white rounded-3xl p-6 border-3 border-yellow-200 hover:border-yellow-400 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-yellow-100 border border-yellow-300 flex items-center justify-center text-3xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                🐝
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors mb-1">
                4. Luyện Tập Cùng AI
              </h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Bạn Ong Vàng AI thông minh giải thích bài học, gợi ý từng bước dễ hiểu và vui nhộn.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-black text-amber-700">
              <span>Hỏi bạn Ong Vàng</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: Thách Đấu */}
          <div
            onClick={() => handleCardClick('challenges')}
            className="bg-white rounded-3xl p-6 border-3 border-indigo-200 hover:border-indigo-400 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 border border-indigo-300 flex items-center justify-center text-3xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                ⚔️
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                5. Thách Đấu
              </h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Đấu trường trực tiếp, thư thách đấu và phòng thi &quot;Thử Thách Cùng Cô&quot; chấm tự luận.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-black text-indigo-700">
              <span>Vào đấu trường</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 6: Thi Đua */}
          <div
            onClick={() => handleCardClick('leaderboard')}
            className="bg-white rounded-3xl p-6 border-3 border-amber-200 hover:border-amber-400 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-3xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                🏆
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors mb-1">
                6. Thi Đua Lớp Học
              </h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Bảng vàng thi đua lớp {classCode}: Top 10 Học tập, Bảng Tiến bộ và Bảng Chăm chỉ mỗi tuần.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-black text-amber-700">
              <span>Xem bảng xếp hạng</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 7: Góc Thành Tích */}
          <div
            onClick={() => handleCardClick('progress')}
            className="bg-white rounded-3xl p-6 border-3 border-emerald-200 hover:border-emerald-400 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-3xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                🎖️
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors mb-1">
                7. Góc Thành Tích
              </h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Tủ 12 huy hiệu vinh danh, ngôi sao tích lũy, chuỗi ngày chăm chỉ và lời khen từ thầy cô.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-black text-emerald-700">
              <span>Xem huy hiệu & sao</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Quest / Thử Thách Hôm Nay */}
      <div className="bg-white rounded-3xl p-6 border-3 border-slate-100 shadow-md mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🎯</span>
          <div>
            <h3 className="font-black text-base text-slate-900">Nhiệm Vụ Hôm Nay Của Bạn Nhỏ</h3>
            <p className="text-xs text-slate-500 font-semibold">Hoàn thành để nhận thêm sao thưởng nhé!</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-slate-800">Hoàn thành 1 bài Toán có nhớ</div>
              <span className="text-amber-600 font-extrabold text-[11px]">+15 điểm • +1 ⭐</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-slate-800">Hỏi bạn Ong Vàng 1 câu hỏi</div>
              <span className="text-amber-600 font-extrabold text-[11px]">+10 điểm • +1 ⭐</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-slate-300 shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-slate-800">Tham gia 1 phòng Thử Thách Cùng Cô</div>
              <span className="text-amber-600 font-extrabold text-[11px]">+30 điểm • +2 ⭐</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
