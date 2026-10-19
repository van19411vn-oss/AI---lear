import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Badge, BadgeCategory } from '../types';
import { soundFx } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Award,
  Sparkles,
  Flame,
  CheckCircle2,
  Lock,
  Calendar,
  Heart,
  TrendingUp,
  BookOpen,
  Calculator,
  X,
} from 'lucide-react';

export const StudentProgressView: React.FC = () => {
  const { currentStudent, currentTeacher, currentClass, getStudentBadgesWithProgress } = useApp();

  const [activeCategory, setActiveCategory] = useState<'all' | BadgeCategory>('all');
  const [selectedBadgeModal, setSelectedBadgeModal] = useState<Badge | null>(null);

  if (!currentStudent) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-slate-500 font-bold">
        Vui lòng đăng nhập để xem hồ sơ tiến bộ của em.
      </div>
    );
  }

  const allBadges = getStudentBadgesWithProgress(currentStudent);
  const unlockedBadgesCount = allBadges.filter((b) => b.isUnlocked).length;

  const filteredBadges = activeCategory === 'all'
    ? allBadges
    : allBadges.filter((b) => b.category === activeCategory);

  const handleOpenBadge = (badge: Badge) => {
    setSelectedBadgeModal(badge);
    if (badge.isUnlocked) {
      soundFx.playCorrect();
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    } else {
      soundFx.playClick();
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Student ID & Overview Hero */}
      <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 rounded-3xl p-6 sm:p-8 shadow-xl shadow-amber-100 mb-8 border-4 border-amber-200 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar Ring */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/95 p-1.5 shadow-lg shadow-amber-300 flex items-center justify-center text-6xl relative animate-float">
            <span>{currentStudent.avatar}</span>
            <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-black text-[11px] shadow-sm">
              {currentStudent.studentCode}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-950 font-black text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Lớp {currentStudent.classCode} • AI LEARN
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              {currentStudent.name}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1 mb-4">
              Phương châm: &quot;Mỗi em một lộ trình – Mỗi ngày một tiến bộ&quot; 🚀
            </p>

            {/* Quick Stats Pill Counters */}
            <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-xs border border-amber-200 flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <div>
                  <div className="text-[10px] font-extrabold text-slate-500 uppercase">Tổng điểm</div>
                  <div className="text-base font-black text-blue-900">{currentStudent.totalPoints} đ</div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-xs border border-amber-200 flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <div>
                  <div className="text-[10px] font-extrabold text-slate-500 uppercase">Sao tích lũy</div>
                  <div className="text-base font-black text-amber-800">{currentStudent.totalStars} sao</div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-xs border border-amber-200 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                <div>
                  <div className="text-[10px] font-extrabold text-slate-500 uppercase">Chuỗi ngày</div>
                  <div className="text-base font-black text-orange-700">{currentStudent.streakDays} ngày liên tiếp</div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-xs border border-amber-200 flex items-center gap-2">
                <span className="text-xl">🎖️</span>
                <div>
                  <div className="text-[10px] font-extrabold text-slate-500 uppercase">Huy hiệu</div>
                  <div className="text-base font-black text-purple-900">{unlockedBadgesCount} / {allBadges.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two columns: Subject Progress & Teacher Note */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Math Progress Card */}
        <div className="bg-white rounded-3xl p-6 border-3 border-amber-100 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-50 rounded-2xl text-2xl border border-amber-200">
              🧮
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Toán Học Lớp 2</h3>
              <p className="text-xs text-slate-400 font-bold">Cộng trừ, nhân chia, đo lường</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Số bài hoàn thành:</span>
                <span className="font-black text-slate-800">{currentStudent.mathProgress.completedLessons} bài</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${Math.min(currentStudent.mathProgress.completedLessons * 10, 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Độ chính xác:</span>
                <span className="font-black text-emerald-600">{currentStudent.mathProgress.accuracy}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${currentStudent.mathProgress.accuracy}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Vietnamese Progress Card */}
        <div className="bg-white rounded-3xl p-6 border-3 border-blue-100 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-2xl text-2xl border border-blue-200">
              📖
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Tiếng Việt Lớp 2</h3>
              <p className="text-xs text-slate-400 font-bold">Từ loại, câu, chính tả, tự luận</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Số bài hoàn thành:</span>
                <span className="font-black text-slate-800">{currentStudent.vietnameseProgress.completedLessons} bài</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min(currentStudent.vietnameseProgress.completedLessons * 10, 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Độ chính xác:</span>
                <span className="font-black text-emerald-600">{currentStudent.vietnameseProgress.accuracy}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${currentStudent.vietnameseProgress.accuracy}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Teacher Note & Encouragement */}
        <div className="bg-white rounded-3xl p-6 border-3 border-rose-100 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">👩‍🏫</span>
              <div>
                <h3 className="font-black text-slate-900 text-sm">Lời Nhắn Của {currentTeacher?.name || 'Thầy Cô'}</h3>
                <p className="text-[11px] font-bold text-rose-600">Giáo viên chủ nhiệm {currentClass?.name || 'lớp'}</p>
              </div>
            </div>
            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs font-semibold text-slate-700 leading-relaxed italic">
              &quot;{currentStudent.teacherNotes || 'Em rất chăm chỉ, luôn nỗ lực trong từng bài học và tiến bộ mỗi ngày!'}&quot;
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Đã cập nhật: Hôm nay</span>
            <span className="text-rose-600 font-black">Yêu quý em ❤️</span>
          </div>
        </div>
      </div>

      {/* ================= TỦ HUY HIỆU RỰC RỠ (BADGES SYSTEM) ================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-3 border-slate-100 shadow-xl mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Tủ Huy Hiệu Của Em
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200">
                {unlockedBadgesCount} / {allBadges.length} Đã mở khóa
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Chạm vào từng huy hiệu để xem chi tiết cách mở khóa nhé!
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setActiveCategory('all');
                soundFx.playClick();
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                activeCategory === 'all'
                  ? 'bg-purple-600 text-white font-black shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({allBadges.length})
            </button>
            <button
              onClick={() => {
                setActiveCategory('academic');
                soundFx.playClick();
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
                activeCategory === 'academic'
                  ? 'bg-amber-500 text-white font-black shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <span>🧮</span>
              <span>Học tập (4)</span>
            </button>
            <button
              onClick={() => {
                setActiveCategory('diligence');
                soundFx.playClick();
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
                activeCategory === 'diligence'
                  ? 'bg-yellow-500 text-slate-900 font-black shadow-xs'
                  : 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100'
              }`}
            >
              <span>🐝</span>
              <span>Chăm chỉ (4)</span>
            </button>
            <button
              onClick={() => {
                setActiveCategory('activity');
                soundFx.playClick();
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
                activeCategory === 'activity'
                  ? 'bg-blue-600 text-white font-black shadow-xs'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
            >
              <span>⚔️</span>
              <span>Hoạt động (4)</span>
            </button>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBadges.map((badge) => {
            const isUnlocked = badge.isUnlocked;
            const curVal = badge.currentCount || 0;
            const progressPercent = Math.min(Math.round((curVal / badge.targetCount) * 100), 100);

            return (
              <div
                key={badge.id}
                onClick={() => handleOpenBadge(badge)}
                className={`rounded-3xl p-5 border-3 transition-all duration-200 cursor-pointer text-center relative group flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-gradient-to-b from-white to-amber-50/40 border-amber-300 shadow-md hover:shadow-xl hover:scale-102'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 opacity-80'
                }`}
              >
                <div>
                  {/* Badge Icon Shield */}
                  <div
                    className={`w-20 h-20 mx-auto rounded-3xl p-1 mb-3 flex items-center justify-center text-4xl shadow-md transition-transform group-hover:scale-110 ${
                      isUnlocked
                        ? `bg-gradient-to-tr ${badge.color} text-white shadow-amber-200 animate-pop`
                        : 'bg-slate-200 text-slate-400 grayscale'
                    }`}
                  >
                    <span>{badge.icon}</span>
                  </div>

                  <h3 className="text-sm font-black text-slate-800 mb-1 leading-snug">
                    {badge.name}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500 line-clamp-2 mb-3">
                    {badge.description}
                  </p>
                </div>

                {/* Progress Bar & Status */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[10px] font-black mb-1">
                    <span className={isUnlocked ? 'text-amber-700' : 'text-slate-500'}>
                      {curVal} / {badge.targetCount} {badge.unit}
                    </span>
                    <span className={isUnlocked ? 'text-emerald-600 font-extrabold' : 'text-slate-400'}>
                      {isUnlocked ? 'Đạt' : `${progressPercent}%`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnlocked ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Locked / Unlocked corner indicator */}
                <div className="absolute top-3 right-3">
                  {isUnlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Badge Celebration Modal */}
      {selectedBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-pop">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-4 border-amber-300 relative">
            <button
              onClick={() => setSelectedBadgeModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div
              className={`w-28 h-28 mx-auto rounded-3xl p-1 mb-4 flex items-center justify-center text-6xl shadow-xl ${
                selectedBadgeModal.isUnlocked
                  ? `bg-gradient-to-tr ${selectedBadgeModal.color} text-white shadow-amber-200 animate-bounce`
                  : 'bg-slate-200 text-slate-400 grayscale'
              }`}
            >
              <span>{selectedBadgeModal.icon}</span>
            </div>

            <div className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 bg-purple-100 text-purple-800">
              {selectedBadgeModal.category === 'academic' && 'Huy Hiệu Học Tập'}
              {selectedBadgeModal.category === 'diligence' && 'Huy Hiệu Chăm Chỉ'}
              {selectedBadgeModal.category === 'activity' && 'Huy Hiệu Hoạt Động'}
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-1">
              {selectedBadgeModal.name}
            </h3>
            <p className="text-xs font-semibold text-slate-600 mb-5 leading-relaxed">
              {selectedBadgeModal.description}
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-left">
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Yêu cầu mở khóa:</span>
                <span className="font-black text-slate-900">{selectedBadgeModal.requirementLabel}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                <span>Tiến độ hiện tại:</span>
                <span className="font-black text-amber-600">
                  {selectedBadgeModal.currentCount || 0} / {selectedBadgeModal.targetCount} {selectedBadgeModal.unit}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      Math.round(((selectedBadgeModal.currentCount || 0) / selectedBadgeModal.targetCount) * 100),
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <button
              onClick={() => setSelectedBadgeModal(null)}
              className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-900 font-black rounded-2xl shadow-md transition active:scale-98"
            >
              {selectedBadgeModal.isUnlocked ? 'Tự hào quá! ⭐' : 'Em sẽ cố gắng đạt được! 💪'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
