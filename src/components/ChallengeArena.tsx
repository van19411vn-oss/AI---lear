import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChallengeMatch, Question, Subject } from '../types';
import { soundFx } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Swords,
  Users,
  Clock,
  Send,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flame,
  Award,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Edit3,
  FileText,
} from 'lucide-react';

export const ChallengeArena: React.FC = () => {
  const {
    currentStudent,
    students,
    challenges,
    createChallenge,
    joinChallenge,
    submitExamRoomAnswers,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'classroom' | 'direct' | 'async'>('classroom');

  // Direct / Classroom duel state
  const [activeMatch, setActiveMatch] = useState<ChallengeMatch | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Student answers state for exam room: { [questionId]: answerString }
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [selectedMCOption, setSelectedMCOption] = useState<string | null>(null);

  // Exam result state
  const [examResult, setExamResult] = useState<{
    autoScore: number;
    needsManualGrading: boolean;
    submitted: boolean;
  } | null>(null);

  // Room code input
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');

  // Peer challenge creator state
  const [createSubject, setCreateSubject] = useState<Subject>('math');
  const [targetStudentId, setTargetStudentId] = useState<string>(students[1]?.id || '');
  const [challengeTitle, setChallengeTitle] = useState('Đố bạn tính nhanh hơn tớ!');

  // Filtered lists
  const classRoomMatches = challenges.filter((c) => c.type === 'class_room');
  const directMatches = challenges.filter((c) => c.type === 'direct');
  const asyncMatches = challenges.filter((c) => c.type === 'asynchronous');

  // Start taking an exam / challenge
  const handleStartExam = (match: ChallengeMatch) => {
    setActiveMatch(match);
    setCurrentQIndex(0);
    setExamAnswers({});
    setSelectedMCOption(null);
    setExamResult(null);
    soundFx.playClick();
  };

  // Quick join by Room Code
  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    const code = inputRoomCode.trim().toUpperCase();
    const found = challenges.find((c) => c.roomCode.toUpperCase() === code);

    if (!found) {
      setJoinError('Không tìm thấy phòng có mã này! Hãy kiểm tra lại nhé.');
      soundFx.playEncourage();
      return;
    }

    joinChallenge(found.id);
    handleStartExam(found);
  };

  // Submit classroom exam answers
  const handleSubmitExam = () => {
    if (!activeMatch) return;

    // Compile answers
    const finalAnswers = { ...examAnswers };
    // Include the active multiple choice option if on an MC question
    const curQ = activeMatch.questions[currentQIndex];
    if (curQ && curQ.type === 'multiple_choice' && selectedMCOption) {
      finalAnswers[curQ.id] = selectedMCOption;
    }

    const res = submitExamRoomAnswers(activeMatch.id, finalAnswers);
    setExamResult({
      autoScore: res.autoScore,
      needsManualGrading: res.needsManualGrading,
      submitted: true,
    });
    soundFx.playFanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Advance question in exam
  const handleNextExamQ = () => {
    if (!activeMatch) return;
    const curQ = activeMatch.questions[currentQIndex];
    if (curQ && curQ.type === 'multiple_choice' && selectedMCOption) {
      setExamAnswers((prev) => ({ ...prev, [curQ.id]: selectedMCOption }));
    }

    if (currentQIndex + 1 < activeMatch.questions.length) {
      setCurrentQIndex((prev) => prev + 1);
      const nextQ = activeMatch.questions[currentQIndex + 1];
      setSelectedMCOption(examAnswers[nextQ.id] || null);
      soundFx.playClick();
    }
  };

  const handlePrevExamQ = () => {
    if (currentQIndex > 0 && activeMatch) {
      setCurrentQIndex((prev) => prev - 1);
      const prevQ = activeMatch.questions[currentQIndex - 1];
      setSelectedMCOption(examAnswers[prevQ.id] || null);
      soundFx.playClick();
    }
  };

  // Create Peer Challenge
  const handleCreatePeerChallenge = (type: 'direct' | 'asynchronous') => {
    const opp = students.find((s) => s.id === targetStudentId);
    const title = challengeTitle.trim() || `Thách đấu ${createSubject === 'math' ? 'Toán' : 'Tiếng Việt'}`;
    const newMatch = createChallenge({
      type,
      title,
      subject: createSubject,
      opponentStudentId: opp?.id,
    });
    handleStartExam(newMatch);
  };

  // ================= VIEW: ACTIVE EXAM / MATCH RUNNER =================
  if (activeMatch) {
    const curQ = activeMatch.questions[currentQIndex];
    const isLastQ = currentQIndex === activeMatch.questions.length - 1;
    const myExistingSub = (activeMatch.submissions || []).find(
      (s) => s.studentId === (currentStudent?.id || 'hs-01')
    );

    // If submitted, show result card
    if (examResult?.submitted || (myExistingSub && myExistingSub.isGradedByTeacher)) {
      const sub = myExistingSub;
      const autoScore = examResult?.autoScore ?? sub?.autoScore ?? 0;
      const totalScore = sub?.totalScore ?? autoScore;

      return (
        <div className="max-w-2xl mx-auto py-8 px-4 animate-pop">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-amber-300 text-center relative">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-4xl shadow-md mb-4">
              🎖️
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
              Hoàn Thành Bài Thi!
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-500 mb-6">
              Phòng thi: <span className="text-blue-600 font-black">{activeMatch.title}</span> (Mã {activeMatch.roomCode})
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4">
                <div className="text-xs font-bold text-emerald-700">Điểm chấm tự động (Trắc nghiệm + Điền từ)</div>
                <div className="text-3xl font-black text-emerald-800 mt-1">{autoScore} điểm</div>
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
                <div className="text-xs font-bold text-blue-700">Trạng thái chấm tự luận</div>
                <div className="text-sm font-black text-blue-900 mt-2">
                  {sub?.isGradedByTeacher ? (
                    <span className="text-emerald-700 font-extrabold">✅ Cô đã chấm (+{sub.manualScore} đ)</span>
                  ) : (
                    <span className="text-amber-700 font-extrabold">⏳ Đang chờ Cô Lan chấm</span>
                  )}
                </div>
              </div>
            </div>

            {sub?.teacherGeneralFeedback && (
              <div className="bg-sky-50 border border-sky-300 rounded-2xl p-4 text-left text-xs font-semibold text-sky-900 mb-6">
                <div className="font-bold flex items-center gap-1.5 text-sky-800 mb-1">
                  <span>👩‍🏫 Lời nhận xét từ Cô giáo:</span>
                </div>
                <p>{sub.teacherGeneralFeedback}</p>
              </div>
            )}

            <button
              onClick={() => setActiveMatch(null)}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg transition active:scale-98"
            >
              Về phòng Thách Đấu
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto py-6 px-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setActiveMatch(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs"
          >
            ← Thoát phòng
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Phòng: {activeMatch.roomCode}
            </span>
            <span className="text-xs font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Câu {currentQIndex + 1}/{activeMatch.questions.length}
            </span>
          </div>
        </div>

        {/* Question Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-3 border-sky-200">
          {/* Question Type Badge */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
              {curQ.type === 'multiple_choice' && '🔘 Trắc nghiệm 4 lựa chọn'}
              {curQ.type === 'fill_in_blank' && '✍️ Điền từ vào chỗ trống'}
              {curQ.type === 'short_answer' && '📝 Câu hỏi tự luận ngắn'}
            </span>
            <span className="text-xs font-black text-amber-600">{curQ.points || 10} điểm</span>
          </div>

          {/* Visual illustration */}
          {curQ.visualIllustration && (
            <div className="my-3 py-3 px-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center text-lg font-bold text-slate-700">
              {curQ.visualIllustration}
            </div>
          )}

          {/* Question Text */}
          <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-relaxed mb-6">
            {curQ.question}
          </h3>

          {/* 1. Multiple Choice Renderer */}
          {curQ.type === 'multiple_choice' && (
            <div className="space-y-3 mb-6">
              {(curQ.options || []).map((opt, idx) => {
                const isSelected = selectedMCOption === opt;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedMCOption(opt);
                      setExamAnswers((prev) => ({ ...prev, [curQ.id]: opt }));
                      soundFx.playClick();
                    }}
                    className={`w-full text-left p-4 rounded-2xl text-base font-bold transition flex items-center gap-3 border-2 active:scale-98 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-md font-black'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-blue-50/50'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-xl bg-white border border-slate-300 flex items-center justify-center font-black text-sm text-slate-700">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. Fill in the Blank Renderer */}
          {curQ.type === 'fill_in_blank' && (
            <div className="mb-6 space-y-2">
              <label className="text-xs font-black text-slate-600 block">
                ✍️ Nhập từ hoặc số cần điền vào chỗ trống:
              </label>
              <input
                type="text"
                value={examAnswers[curQ.id] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setExamAnswers((prev) => ({ ...prev, [curQ.id]: val }));
                }}
                placeholder="Gõ câu trả lời của em vào đây..."
                className="w-full p-4 rounded-2xl border-2 border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-hidden font-bold text-lg text-slate-800 bg-slate-50"
              />
              <p className="text-[11px] font-semibold text-slate-500">
                💡 Hệ thống sẽ tự động đối chiếu và chấm điểm cho câu trả lời của em.
              </p>
            </div>
          )}

          {/* 3. Short Answer Essay Renderer (with Character Limit) */}
          {curQ.type === 'short_answer' && (
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-slate-600">
                <span className="flex items-center gap-1">
                  <Edit3 className="w-4 h-4 text-purple-600" />
                  Viết câu trả lời tự luận:
                </span>
                <span
                  className={`font-black ${
                    (examAnswers[curQ.id] || '').length >= (curQ.maxCharacters || 150)
                      ? 'text-rose-600'
                      : 'text-slate-500'
                  }`}
                >
                  {(examAnswers[curQ.id] || '').length} / {curQ.maxCharacters || 150} ký tự
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={curQ.maxCharacters || 150}
                value={examAnswers[curQ.id] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setExamAnswers((prev) => ({ ...prev, [curQ.id]: val }));
                }}
                placeholder="Em hãy viết tròn câu, rõ ý, có dấu chấm ở cuối câu nhé..."
                className="w-full p-4 rounded-2xl border-2 border-slate-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-hidden font-semibold text-base text-slate-800 bg-slate-50"
              />
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs font-semibold text-purple-800">
                👩‍🏫 <strong>Lưu ý:</strong> Câu tự luận sẽ được gửi trực tiếp đến Thầy Cô giáo để chấm điểm và nhận xét riêng cho con!
              </div>
            </div>
          )}

          {/* Navigation & Submission Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              disabled={currentQIndex === 0}
              onClick={handlePrevExamQ}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              ← Câu trước
            </button>

            {!isLastQ ? (
              <button
                onClick={handleNextExamQ}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitExam}
                className="px-7 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-200 transition active:scale-98 flex items-center gap-1.5"
              >
                <span>Nộp bài thi 🚀</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= VIEW: MAIN ARENA DASHBOARD =================
  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100 mb-8 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 text-8xl opacity-20 select-none">⚔️</div>
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-black uppercase tracking-wider text-amber-300 mb-2">
            <Flame className="w-3.5 h-3.5" />
            Đấu Trường Tri Thức • Lớp 2
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-2">
            Thách Đấu Cùng Bạn Bè & Thử Thách Cùng Cô!
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-indigo-100 mb-6 leading-relaxed">
            Thi đấu vui vẻ, không áp lực! Cùng nhau rèn luyện tư duy Toán học và vốn từ Tiếng Việt để cùng tiến bộ mỗi ngày.
          </p>

          {/* Quick Join by Room Code form */}
          <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row gap-2 max-w-md">
            <input
              type="text"
              value={inputRoomCode}
              onChange={(e) => setInputRoomCode(e.target.value)}
              placeholder="Nhập mã phòng (VD: PHONG-101)..."
              className="px-4 py-3 bg-white text-slate-800 font-black rounded-2xl text-xs sm:text-sm focus:outline-hidden focus:ring-4 focus:ring-amber-300 placeholder:text-slate-400 flex-1 uppercase"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-900 font-black text-xs sm:text-sm rounded-2xl shadow-md transition active:scale-95"
            >
              Vào phòng ngay 🚀
            </button>
          </form>
          {joinError && <p className="text-xs font-bold text-amber-200 mt-2">{joinError}</p>}
        </div>
      </div>

      {/* Arena Sub-tabs */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto gap-2">
        <button
          onClick={() => {
            setActiveSubTab('classroom');
            soundFx.playClick();
          }}
          className={`pb-3 px-4 font-black text-sm whitespace-nowrap border-b-3 transition flex items-center gap-2 ${
            activeSubTab === 'classroom'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>👩‍🏫 Thử Thách Cùng Cô</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-extrabold">
            {classRoomMatches.length} phòng
          </span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('direct');
            soundFx.playClick();
          }}
          className={`pb-3 px-4 font-black text-sm whitespace-nowrap border-b-3 transition flex items-center gap-2 ${
            activeSubTab === 'direct'
              ? 'border-blue-600 text-blue-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>⚡ Thách Đấu Trực Tiếp</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-extrabold">
            {directMatches.length} trận
          </span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('async');
            soundFx.playClick();
          }}
          className={`pb-3 px-4 font-black text-sm whitespace-nowrap border-b-3 transition flex items-center gap-2 ${
            activeSubTab === 'async'
              ? 'border-amber-600 text-amber-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>💌 Thư Thách Đấu (Không đồng thời)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-extrabold">
            {asyncMatches.length} thư
          </span>
        </button>
      </div>

      {/* SUBTAB 1: THỬ THÁCH CÙNG CÔ (UPGRADED) */}
      {activeSubTab === 'classroom' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-3xl p-5 mb-6 text-xs font-semibold text-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-black text-sm text-indigo-950 mb-1 flex items-center gap-2">
                <span>🌟 Tính năng mới: Đề thi đa dạng 3 dạng câu hỏi!</span>
              </div>
              <p className="leading-relaxed">
                Phòng thi của cô bao gồm: <strong>Trắc nghiệm</strong>, <strong>Điền từ vào chỗ trống</strong> (hệ thống tự động chấm điểm), và <strong>Câu hỏi tự luận ngắn</strong> (được Cô Lan trực tiếp chấm và nhận xét).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classRoomMatches.map((match) => {
              const mySub = (match.submissions || []).find(
                (s) => s.studentId === (currentStudent?.id || 'hs-01')
              );

              return (
                <div
                  key={match.id}
                  className="bg-white rounded-3xl p-6 border-3 border-indigo-100 hover:border-indigo-300 shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-800">
                        Mã phòng: {match.roomCode}
                      </span>
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {match.timePerQuestion * match.totalQuestions} giây
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 mb-1.5">{match.title}</h3>

                    <div className="flex flex-wrap gap-1.5 my-3">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                        🔘 Trắc nghiệm
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">
                        ✍️ Điền từ
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">
                        📝 Tự luận ngắn
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-semibold mb-4">
                      Tạo bởi: {match.hostStudentName} • Sĩ số đã nộp: {(match.submissions || []).length} bạn
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    {mySub ? (
                      <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Đã làm: {mySub.totalScore}/{mySub.maxPossibleScore} đ</span>
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-amber-700">Chưa làm bài</div>
                    )}

                    <button
                      onClick={() => handleStartExam(match)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition"
                    >
                      {mySub ? 'Xem bài làm' : 'Vào thi ngay'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: THÁCH ĐẤU TRỰC TIẾP */}
      {activeSubTab === 'direct' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Direct Duel */}
          <div className="bg-white rounded-3xl p-6 border-3 border-blue-100 shadow-md">
            <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <Swords className="w-5 h-5 text-blue-600" />
              Tạo phòng đấu nhanh với bạn
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Môn thi đấu:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateSubject('math')}
                    className={`py-2 text-xs font-black rounded-xl border-2 transition ${
                      createSubject === 'math'
                        ? 'bg-amber-100 border-amber-400 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Toán Lớp 2 📐
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateSubject('vietnamese')}
                    className={`py-2 text-xs font-black rounded-xl border-2 transition ${
                      createSubject === 'vietnamese'
                        ? 'bg-blue-100 border-blue-400 text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Tiếng Việt 2 📖
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Chọn bạn cùng lớp:</label>
                <select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {students
                    .filter((s) => s.id !== currentStudent?.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.avatar} {s.name} ({s.studentCode})
                      </option>
                    ))}
                </select>
              </div>

              <button
                onClick={() => handleCreatePeerChallenge('direct')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition"
              >
                Mở phòng & Bắt đầu ngay 🚀
              </button>
            </div>
          </div>

          {/* List of recent Direct Duels */}
          <div className="space-y-3">
            <h3 className="text-base font-black text-slate-800">Các trận đấu vừa diễn ra</h3>
            {directMatches.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800">{m.title}</div>
                  <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    {m.hostAvatar} {m.hostStudentName} ({m.hostScore}đ) VS {m.opponentAvatar} {m.opponentStudentName || 'Bạn cùng lớp'} ({m.opponentScore}đ)
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  {m.winnerId === m.hostStudentId ? `${m.hostStudentName} thắng 🏆` : 'Hoàn thành'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: THÁCH ĐẤU KHÔNG ĐỒNG THỜI */}
      {activeSubTab === 'async' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border-3 border-amber-100 shadow-md">
            <h3 className="text-base font-black text-slate-900 mb-2 flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-600" />
              Gửi Thư Thách Đấu Cho Bạn
            </h3>
            <p className="text-xs text-slate-500 font-semibold mb-4">
              Bạn có thể làm bài bất cứ khi nào rảnh, khi cả 2 bạn cùng làm xong hệ thống sẽ so sánh kết quả!
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Lời nhắn thử thách:</label>
                <input
                  type="text"
                  value={challengeTitle}
                  onChange={(e) => setChallengeTitle(e.target.value)}
                  placeholder="Gõ lời nhắn vui nhộn..."
                  className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Gửi cho bạn:</label>
                <select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {students
                    .filter((s) => s.id !== currentStudent?.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.avatar} {s.name} ({s.studentCode})
                      </option>
                    ))}
                </select>
              </div>

              <button
                onClick={() => handleCreatePeerChallenge('asynchronous')}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs rounded-xl shadow-md transition"
              >
                Gửi thư thách đấu 💌
              </button>
            </div>
          </div>

          {/* List of async challenge letters */}
          <div className="space-y-3">
            <h3 className="text-base font-black text-slate-800">Hộp thư thách đấu</h3>
            {asyncMatches.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800">{m.title}</div>
                  <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    Người gửi: {m.hostAvatar} {m.hostStudentName} • {m.subject === 'math' ? 'Toán' : 'Tiếng Việt'}
                  </div>
                </div>
                <button
                  onClick={() => handleStartExam(m)}
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-black text-xs rounded-xl shadow-xs transition"
                >
                  Mở làm bài
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
