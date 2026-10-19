import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { StudentHome } from './components/StudentHome';
import { PracticeZone } from './components/PracticeZone';
import { AIAssistantBot } from './components/AIAssistantBot';
import { ChallengeArena } from './components/ChallengeArena';
import { LeaderboardView } from './components/LeaderboardView';
import { StudentProgressView } from './components/StudentProgressView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentRosterView } from './components/StudentRosterView';
import { LoginModal } from './components/LoginModal';
import { FirebaseGuideModal } from './components/FirebaseGuideModal';
import { Heart, Sparkles, ShieldCheck, Database, Info } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentRole, currentStudent } = useApp();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginDefaultRole, setLoginDefaultRole] = useState<'student' | 'teacher'>('student');
  const [isFirebaseOpen, setIsFirebaseOpen] = useState(false);

  const handleOpenLogin = (role?: 'student' | 'teacher') => {
    if (role) setLoginDefaultRole(role);
    setIsLoginOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenFirebaseGuide={() => setIsFirebaseOpen(true)}
        onOpenLogin={() => handleOpenLogin()}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'home' && (
          <div>
            <StudentHome
              onNavigate={(tabId) => setActiveTab(tabId)}
              onOpenLogin={(role) => handleOpenLogin(role)}
            />
            {/* Direct practice section below home cards */}
            <div className="border-t border-slate-200/80 pt-6">
              <PracticeZone
                onGoToAIBot={() => setActiveTab('ai-bot')}
                onGoToLeaderboard={() => setActiveTab('leaderboard')}
              />
            </div>
          </div>
        )}

        {activeTab === 'ai-bot' && <AIAssistantBot />}

        {activeTab === 'challenges' && <ChallengeArena />}

        {activeTab === 'leaderboard' && <LeaderboardView />}

        {activeTab === 'progress' && <StudentProgressView />}

        {activeTab === 'roster' && <StudentRosterView />}

        {activeTab === 'teacher' && <TeacherDashboard />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-amber-200 py-6 px-4 text-center text-xs font-semibold text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl select-none">🐝</span>
            <span className="font-black text-slate-800 text-sm">AI LEARN – TRẠM HỌC TẬP THÔNG MINH</span>
            <span className="text-slate-400">•</span>
            <span>Mỗi em một lộ trình – Mỗi ngày một tiến bộ</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFirebaseOpen(true)}
              className="text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Kiến trúc Firebase & Bảo mật</span>
            </button>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 font-bold">Nền tảng học tập thông minh cho học sinh & giáo viên Lớp 2</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        defaultRole={loginDefaultRole}
      />
      <FirebaseGuideModal isOpen={isFirebaseOpen} onClose={() => setIsFirebaseOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
