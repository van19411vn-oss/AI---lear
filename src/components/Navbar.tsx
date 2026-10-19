import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { soundFx } from '../utils/sound';
import {
  BookOpen,
  Bot,
  Swords,
  Trophy,
  GraduationCap,
  Sparkles,
  Volume2,
  VolumeX,
  Database,
  LogOut,
  ChevronDown,
  User,
  Users,
  Flame,
  Award,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenFirebaseGuide: () => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenFirebaseGuide,
  onOpenLogin,
}) => {
  const {
    currentRole,
    currentStudent,
    currentTeacher,
    currentClass,
    teachers,
    classes,
    isLoggedIn,
    logout,
    students,
    quickSwitchDemoUser,
    challenges,
  } = useApp();

  const [isMuted, setIsMuted] = useState(soundFx.getMuted());
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);

  // Check pending ungraded submissions or pending AI questions for teacher badge
  const pendingSubmissions = challenges.reduce((total, c) => {
    const ungraded = (c.submissions || []).filter((s) => !s.isGradedByTeacher).length;
    return total + ungraded;
  }, 0);

  const toggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
    if (!muted) soundFx.playClick();
  };

  const navItems = [
    { id: 'home', label: 'Học tập', icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
    { id: 'ai-bot', label: 'Bạn AI', icon: Bot, color: 'text-amber-600 bg-amber-50', badge: 'Ong Vàng' },
    { id: 'challenges', label: 'Thách đấu', icon: Swords, color: 'text-violet-600 bg-violet-50', badge: '3 chế độ' },
    { id: 'leaderboard', label: 'Thi đua', icon: Trophy, color: 'text-amber-500 bg-yellow-50' },
    { id: 'progress', label: 'Tiến bộ của em', icon: Award, color: 'text-emerald-600 bg-emerald-50' },
    {
      id: 'roster',
      label: '📋 Danh sách học sinh',
      icon: Users,
      color: 'text-sky-600 bg-sky-50',
      badge: currentRole === 'teacher' ? 'Excel & Hồ sơ' : 'Dành cho GV',
    },
    {
      id: 'teacher',
      label: 'Góc giáo viên',
      icon: GraduationCap,
      color: 'text-rose-600 bg-rose-50',
      badge: pendingSubmissions > 0 ? `${pendingSubmissions} bài cần chấm` : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-amber-200 shadow-sm">
      {/* Top Bar for Brand & User Profile */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Logo & School Slogan */}
        <div
          onClick={() => {
            setActiveTab('home');
            soundFx.playClick();
          }}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-300 to-sky-400 flex items-center justify-center shadow-md shadow-amber-200 text-2xl group-hover:scale-105 transition-transform duration-200 select-none">
            🐝
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-black tracking-tight text-blue-900 font-sans">
                AI LEARN
              </span>
              <span className="hidden xs:inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                {currentClass?.name || 'Khối 2'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 line-clamp-1">
              Mỗi em một lộ trình – Mỗi ngày một tiến bộ
            </p>
          </div>
        </div>

        {/* Right Tools & Profile Info */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Quick Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowSwitchMenu(!showSwitchMenu)}
              className="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition border border-slate-200 shadow-xs"
              title="Đổi nhanh người dùng để thử nghiệm"
            >
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Thử vai:</span>
              <span className="text-blue-700 font-black truncate max-w-[110px] sm:max-w-none">
                {currentRole === 'teacher'
                  ? `${currentTeacher?.avatar || '👩‍🏫'} ${currentTeacher?.name || 'Giáo viên'}`
                  : `${currentStudent?.avatar || '🎒'} ${currentStudent?.name || 'Học sinh'}`}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showSwitchMenu && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-2xl shadow-2xl border-2 border-amber-200 p-2.5 z-50 animate-pop">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Chọn giáo viên mẫu:
                </div>
                <div className="space-y-1 mb-2">
                  {teachers.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        quickSwitchDemoUser('teacher', t.id);
                        setShowSwitchMenu(false);
                        setActiveTab('teacher');
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                        currentRole === 'teacher' && currentTeacher?.id === t.id
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-lg">{t.avatar}</span>
                      <div className="flex-1">
                        <div>{t.name}</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          {t.roleTitle} • {t.schoolName}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 my-1.5"></div>

                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Học sinh mẫu ({currentClass?.name}):
                </div>
                <div className="max-h-44 overflow-y-auto space-y-0.5">
                  {students.slice(0, 5).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        quickSwitchDemoUser('student', s.id);
                        setShowSwitchMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                        currentStudent?.id === s.id && currentRole === 'student'
                          ? 'bg-blue-100 text-blue-900 font-black'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{s.avatar}</span>
                        <span>{s.name}</span>
                      </div>
                      <span className="text-[10px] text-amber-600 font-bold">{s.totalStars} ⭐</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Student Status Counters (Stars & Points) */}
          {currentRole === 'student' && currentStudent && (
            <div className="flex items-center gap-1 sm:gap-2 bg-amber-50 border border-amber-200 px-2 sm:px-3 py-1 rounded-xl">
              <div className="flex items-center gap-1 text-amber-700 font-extrabold text-xs">
                <span>⭐</span>
                <span>{currentStudent.totalStars}</span>
              </div>
              <div className="h-3 w-px bg-amber-200"></div>
              <div className="flex items-center gap-1 text-blue-700 font-extrabold text-xs">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                <span>{currentStudent.streakDays} ngày</span>
              </div>
            </div>
          )}

          {/* Sound toggle button */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition ${
              isMuted
                ? 'bg-slate-100 text-slate-400 border-slate-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
            }`}
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Firebase Guide Button */}
          <button
            onClick={onOpenFirebaseGuide}
            className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition shadow-xs"
            title="Kiến trúc bảo mật & Hướng dẫn Firebase"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* Login / Logout button */}
          {isLoggedIn ? (
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 transition"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs - Highly touch-friendly & responsive */}
      <nav className="max-w-7xl mx-auto px-2 sm:px-6 flex items-center justify-start sm:justify-center overflow-x-auto gap-1 sm:gap-2 py-1.5 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                soundFx.playClick();
              }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-2xl font-black text-xs sm:text-sm whitespace-nowrap transition-all duration-200 relative select-none ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-102 -translate-y-0.5'
                  : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase ${
                    isActive
                      ? 'bg-amber-400 text-slate-900'
                      : 'bg-rose-500 text-white animate-pulse'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
