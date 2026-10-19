import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { soundFx } from '../utils/sound';
import { Trophy, TrendingUp, Flame, Star, Award, Sparkles, Medal } from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  const { currentStudent, currentClass, getLeaderboard } = useApp();
  const [activeBoard, setActiveBoard] = useState<'gold' | 'progress' | 'diligent'>('gold');

  const list = getLeaderboard(activeBoard);
  const top10 = list.slice(0, 10);
  const myEntry = list.find((item) => item.id === currentStudent?.id);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: 'bg-amber-400 text-slate-900 shadow-md shadow-amber-200', icon: '🥇' };
    if (rank === 2) return { bg: 'bg-slate-300 text-slate-900', icon: '🥈' };
    if (rank === 3) return { bg: 'bg-amber-600 text-white', icon: '🥉' };
    return { bg: 'bg-slate-100 text-slate-600', icon: `${rank}` };
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Vườn Hoa Thi Đua • {currentClass?.name || 'Khối 2'}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
          Bảng Vàng Vinh Danh & Tiến Bộ
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-slate-500">
          Mỗi ngày một nỗ lực nhỏ sẽ làm nên điều kỳ diệu lớn! 🌟
        </p>
      </div>

      {/* 3 Tab Switchers */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-xl mx-auto mb-8">
        <button
          onClick={() => {
            setActiveBoard('gold');
            soundFx.playClick();
          }}
          className={`py-3 px-2 sm:px-4 rounded-2xl font-black text-xs sm:text-sm transition flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
            activeBoard === 'gold'
              ? 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-200 scale-102 font-extrabold'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-800" />
          <span>Bảng Vàng</span>
        </button>

        <button
          onClick={() => {
            setActiveBoard('progress');
            soundFx.playClick();
          }}
          className={`py-3 px-2 sm:px-4 rounded-2xl font-black text-xs sm:text-sm transition flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
            activeBoard === 'progress'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-102 font-extrabold'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-blue-200" />
          <span>Tiến Bộ</span>
        </button>

        <button
          onClick={() => {
            setActiveBoard('diligent');
            soundFx.playClick();
          }}
          className={`py-3 px-2 sm:px-4 rounded-2xl font-black text-xs sm:text-sm transition flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
            activeBoard === 'diligent'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 scale-102 font-extrabold'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Flame className="w-4 h-4 text-yellow-200" />
          <span>Chăm Chỉ</span>
        </button>
      </div>

      {/* Top 3 Podium Cards */}
      {top10.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end mb-8 max-w-2xl mx-auto pt-6">
          {/* Rank 2 (Silver) */}
          <div className="bg-white rounded-3xl p-3 sm:p-4 border-2 border-slate-200 shadow-sm text-center flex flex-col items-center">
            <span className="text-3xl sm:text-4xl mb-1">{top10[1].avatar}</span>
            <div className="w-6 h-6 rounded-full bg-slate-300 font-black text-xs flex items-center justify-center text-slate-800 mb-1">
              2
            </div>
            <div className="font-black text-xs sm:text-sm text-slate-800 truncate max-w-full">
              {top10[1].name}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-0.5">
              {activeBoard === 'gold' && `${top10[1].points} đ`}
              {activeBoard === 'progress' && `+${top10[1].recentGrowthPoints} đ`}
              {activeBoard === 'diligent' && `${top10[1].streakDays} ngày 🔥`}
            </div>
          </div>

          {/* Rank 1 (Gold - Taller Podium) */}
          <div className="bg-gradient-to-b from-amber-50 to-amber-100/70 rounded-3xl p-4 sm:p-5 border-3 border-amber-400 shadow-xl text-center flex flex-col items-center -translate-y-3 relative">
            <div className="absolute -top-3 px-3 py-0.5 bg-amber-400 text-slate-900 rounded-full font-black text-[10px] shadow-sm uppercase">
              Quán Quân 👑
            </div>
            <span className="text-4xl sm:text-5xl mb-1 mt-1 animate-bounce">{top10[0].avatar}</span>
            <div className="w-7 h-7 rounded-full bg-amber-400 font-black text-sm flex items-center justify-center text-slate-900 shadow-sm mb-1">
              1
            </div>
            <div className="font-black text-xs sm:text-base text-slate-900 truncate max-w-full">
              {top10[0].name}
            </div>
            <div className="text-xs font-black text-amber-800 mt-0.5">
              {activeBoard === 'gold' && `${top10[0].points} đ 🏆`}
              {activeBoard === 'progress' && `+${top10[0].recentGrowthPoints} đ 🚀`}
              {activeBoard === 'diligent' && `${top10[0].streakDays} ngày 🔥`}
            </div>
          </div>

          {/* Rank 3 (Bronze) */}
          <div className="bg-white rounded-3xl p-3 sm:p-4 border-2 border-amber-200 shadow-sm text-center flex flex-col items-center">
            <span className="text-3xl sm:text-4xl mb-1">{top10[2].avatar}</span>
            <div className="w-6 h-6 rounded-full bg-amber-600 font-black text-xs flex items-center justify-center text-white mb-1">
              3
            </div>
            <div className="font-black text-xs sm:text-sm text-slate-800 truncate max-w-full">
              {top10[2].name}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-0.5">
              {activeBoard === 'gold' && `${top10[2].points} đ`}
              {activeBoard === 'progress' && `+${top10[2].recentGrowthPoints} đ`}
              {activeBoard === 'diligent' && `${top10[2].streakDays} ngày 🔥`}
            </div>
          </div>
        </div>
      )}

      {/* My Rank Highlight Box */}
      {myEntry && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{myEntry.avatar}</span>
            <div>
              <div className="text-xs font-extrabold uppercase text-blue-600">Vị trí của bạn ({myEntry.name}):</div>
              <div className="text-base font-black text-blue-900">
                Hạng #{myEntry.rank} • {myEntry.points} điểm • {myEntry.stars} ⭐
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-700 hidden sm:inline">
            Cố gắng thêm chút nữa để thăng hạng nhé! 💪
          </span>
        </div>
      )}

      {/* Full Top 10 List */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border-3 border-slate-100 shadow-md">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 px-2">
          Top 10 Bạn Xuất Sắc {currentClass?.name || 'Lớp Học'}
        </h3>

        <div className="space-y-2">
          {top10.map((item) => {
            const badge = getRankBadge(item.rank);
            const isMe = item.id === currentStudent?.id;

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl flex items-center justify-between transition ${
                  isMe
                    ? 'bg-blue-50/80 border-2 border-blue-400 font-black shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100/80 border border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${badge.bg}`}
                  >
                    {badge.icon}
                  </div>
                  <span className="text-2xl">{item.avatar}</span>
                  <div>
                    <div className="font-black text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                      <span>{item.name}</span>
                      {isMe && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-blue-600 text-white rounded-full">
                          Tôi
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500">
                      Mã: {item.studentCode} • Độ chính xác: {item.accuracy}%
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-sm text-blue-900">
                    {activeBoard === 'gold' && `${item.points} đ`}
                    {activeBoard === 'progress' && `+${item.recentGrowthPoints} đ`}
                    {activeBoard === 'diligent' && `${item.streakDays} ngày`}
                  </div>
                  <div className="text-[11px] font-bold text-amber-600 flex items-center justify-end gap-1">
                    <span>{item.stars} ⭐</span>
                    <span>• {item.badgeCount} 🎖️</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
