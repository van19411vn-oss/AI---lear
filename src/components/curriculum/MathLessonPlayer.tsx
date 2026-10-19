import React, { useState, useEffect } from 'react';
import { CurriculumLesson, MathActivityType, CurriculumQuestion } from '../../types/curriculum';
import { useApp } from '../../context/AppContext';
import { soundFx } from '../../utils/sound';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Check,
  Award,
  ChevronRight,
  Calculator,
  Bot,
  Gamepad2,
  Rocket,
  ShieldCheck,
  Star,
  Flame,
} from 'lucide-react';

interface Props {
  lesson: CurriculumLesson;
  onBack: () => void;
}

export const MathLessonPlayer: React.FC<Props> = ({ lesson, onBack }) => {
  const { currentStudent, recordLessonCompletion } = useApp();

  const [activeActivity, setActiveActivity] = useState<MathActivityType>('basic');
  const [questions, setQuestions] = useState<CurriculumQuestion[]>(lesson.defaultQuestions);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // In-question states
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [fillBlankInput, setFillBlankInput] = useState('');
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [aiHintText, setAiHintText] = useState('');
  const [isLoadingAIHint, setIsLoadingAIHint] = useState(false);
  const [isGeneratingNewAI, setIsGeneratingNewAI] = useState(false);

  // Score & Progress states
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [wrongAnswersCount, setWrongAnswersCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [completionResult, setCompletionResult] = useState<{
    pointsAdded: number;
    starsAdded: number;
    isFirstOrImproved: boolean;
  } | null>(null);

  // Game activity state (Trò chơi học tập)
  const [gameScore, setGameScore] = useState(0);
  const [gameTarget, setGameTarget] = useState<number>(20);
  const [bubbleNumbers, setBubbleNumbers] = useState<number[]>([5, 12, 15, 8, 20]);
  const [gameMessage, setGameMessage] = useState('');

  // Filter questions for active activity
  const activeQuestions = questions.filter((q) => q.activityType === activeActivity || activeActivity === 'basic');
  const currentQ = activeQuestions[currentQIndex] || activeQuestions[0] || questions[0];

  // Reset when activity changes
  useEffect(() => {
    setCurrentQIndex(0);
    setSelectedOption(null);
    setFillBlankInput('');
    setIsAnswerChecked(false);
    setShowHint(false);
    setAiHintText('');
    setCorrectAnswersCount(0);
    setWrongAnswersCount(0);
    setIsFinished(false);
    setCompletionResult(null);

    // Initialize interactive game
    if (activeActivity === 'game') {
      initGame();
    }
  }, [activeActivity]);

  const initGame = () => {
    const target = 10 + Math.floor(Math.random() * 20);
    setGameTarget(target);
    const nums = [
      target - 3,
      target + 2,
      target,
      target - 1,
      target + 5,
    ].sort(() => Math.random() - 0.5);
    setBubbleNumbers(nums);
    setGameMessage(`Hãy chạm vào bong bóng có số bằng ${target} nhé! 🎈`);
  };

  const handleBubbleClick = (num: number) => {
    if (num === gameTarget) {
      soundFx.playCorrect();
      setGameScore((prev) => prev + 10);
      setGameMessage(`Chính xác rồi! Bé tìm được số ${num} tuyệt vời! 🎉`);
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      setTimeout(initGame, 1500);
    } else {
      soundFx.playEncourage();
      setGameMessage(`Chưa đúng rồi! Bé tìm số ${gameTarget} cơ mà, cố lên nào! 💪`);
    }
  };

  // Check student answer
  const handleCheckAnswer = () => {
    if (!currentQ) return;
    setIsAnswerChecked(true);

    let isCorrect = false;
    if (currentQ.type === 'multiple_choice') {
      isCorrect = (selectedOption || '').trim() === (currentQ.correctAnswer || '').trim();
    } else if (currentQ.type === 'fill_in_blank') {
      const userVal = fillBlankInput.trim().toLowerCase();
      const acceptable = (currentQ.acceptableAnswers || [currentQ.correctAnswer]).map((a) =>
        a.trim().toLowerCase()
      );
      isCorrect = acceptable.includes(userVal);
    }

    if (isCorrect) {
      soundFx.playCorrect();
      setCorrectAnswersCount((prev) => prev + 1);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#F59E0B', '#3B82F6', '#10B981'],
      });
    } else {
      soundFx.playEncourage();
      setWrongAnswersCount((prev) => prev + 1);
    }
  };

  // Next question or finish
  const handleNextQuestion = () => {
    soundFx.playClick();
    if (currentQIndex < activeQuestions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setFillBlankInput('');
      setIsAnswerChecked(false);
      setShowHint(false);
      setAiHintText('');
    } else {
      // Completed lesson activity
      handleFinishActivity();
    }
  };

  // Finish activity & persist
  const handleFinishActivity = () => {
    const totalQ = Math.max(activeQuestions.length, 1);
    const score = Math.round((correctAnswersCount / totalQ) * 100);

    const result = recordLessonCompletion({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      subject: 'math',
      volume: lesson.volume,
      activityType: activeActivity,
      activityName: getActivityLabel(activeActivity),
      totalQuestions: totalQ,
      correctCount: correctAnswersCount,
      score,
    });

    setCompletionResult(result);
    setIsFinished(true);
    soundFx.playFanfare();
  };

  // Ask Ong Vang AI for step-by-step hint
  const handleAskAI = async () => {
    if (!currentQ) return;
    setShowHint(true);
    if (currentQ.hint) {
      setAiHintText(currentQ.hint);
      return;
    }

    setIsLoadingAIHint(true);
    try {
      const res = await fetch('/api/ai/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          options: currentQ.options,
          subject: 'Toán lớp 2',
          topic: lesson.title,
        }),
      });
      const data = await res.json();
      setAiHintText(data.hint || 'Ong Vàng khuyên con đếm kỹ từng đơn vị trước nhé! 🐝');
    } catch {
      setAiHintText('Ong Vàng nhắc con: Hãy đọc kỹ yêu cầu và tính nhẩm từ tốn nhé! 💡');
    } finally {
      setIsLoadingAIHint(false);
    }
  };

  // Generate new questions using AI
  const handleGenerateAIQuiz = async () => {
    setIsGeneratingNewAI(true);
    soundFx.playClick();
    try {
      const res = await fetch('/api/ai/generate-curriculum-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'math',
          volume: lesson.volume,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          themeName: lesson.themeName,
          learningGoals: lesson.learningGoals,
          difficulty: lesson.difficulty,
          activityType: getActivityLabel(activeActivity),
          count: 5,
        }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        const mapped = data.questions.map((q: any, i: number) => ({
          ...q,
          id: `ai_q_${Date.now()}_${i}`,
          activityType: activeActivity,
          type: 'multiple_choice',
          points: 10,
        }));
        setQuestions(mapped);
        setCurrentQIndex(0);
        setSelectedOption(null);
        setIsAnswerChecked(false);
        setCorrectAnswersCount(0);
        setWrongAnswersCount(0);
        setIsFinished(false);
        soundFx.playCorrect();
      }
    } catch {
      alert('Chưa thể kết nối AI, hệ thống đang dùng bộ câu hỏi chuẩn SGK!');
    } finally {
      setIsGeneratingNewAI(false);
    }
  };

  const getActivityLabel = (type: MathActivityType) => {
    switch (type) {
      case 'review':
        return '1. Ôn kiến thức';
      case 'basic':
        return '2. Bài tập cơ bản';
      case 'reinforce':
        return '3. Bài tập củng cố';
      case 'apply':
        return '4. Vận dụng';
      case 'game':
        return '5. Trò chơi học tập';
      case 'advanced':
        return '6. Thử thách nâng cao';
    }
  };

  const activityTabs: { type: MathActivityType; label: string; icon: string }[] = [
    { type: 'review', label: 'Ôn kiến thức', icon: '📖' },
    { type: 'basic', label: 'Cơ bản', icon: '✏️' },
    { type: 'reinforce', label: 'Củng cố', icon: '🎯' },
    { type: 'apply', label: 'Vận dụng', icon: '🚀' },
    { type: 'game', label: 'Trò chơi', icon: '🎮' },
    { type: 'advanced', label: 'Nâng cao', icon: '🏆' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-pop">
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 rounded-3xl p-5 sm:p-6 text-slate-900 shadow-xl border-3 border-amber-300 relative">
        <div className="flex items-center justify-between gap-3 mb-3">
          <button
            onClick={onBack}
            className="px-3.5 py-1.5 bg-white/80 hover:bg-white text-slate-800 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại bài học</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-900/10 backdrop-blur-sm rounded-full text-[11px] font-black uppercase text-amber-950">
              Toán Lớp 2 • Tập {lesson.volume}
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded-full text-[10px] font-bold">
              SGK Kết nối tri thức
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">
              {lesson.themeName}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">{lesson.title}</h1>
          </div>

          <button
            onClick={handleGenerateAIQuiz}
            disabled={isGeneratingNewAI}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-md transition flex items-center gap-2 active:scale-95"
            title="Nhờ AI tạo thêm bộ câu hỏi mới cho bài này"
          >
            <Bot className="w-4 h-4" />
            <span>{isGeneratingNewAI ? 'Đang soạn đề...' : 'AI Soạn Câu Hỏi Mới ✨'}</span>
          </button>
        </div>
      </div>

      {/* 6 Hoạt Động Học Tập Tabs (Phần 3) */}
      <div className="bg-white rounded-2xl p-2 border-2 border-amber-200 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {activityTabs.map((tab) => {
          const isActive = activeActivity === tab.type;
          return (
            <button
              key={tab.type}
              onClick={() => {
                setActiveActivity(tab.type);
                soundFx.playClick();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-400 text-slate-900 shadow-md scale-102'
                  : 'text-slate-600 hover:bg-amber-50 hover:text-amber-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= 1. HOẠT ĐỘNG: ÔN KIẾN THỨC ================= */}
      {activeActivity === 'review' && (
        <div className="bg-white rounded-3xl p-6 border-3 border-amber-100 shadow-md space-y-5 animate-pop">
          <div className="flex items-center gap-2 text-base font-black text-slate-900">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <span>Ghi Nhớ Kiến Thức Trọng Tâm</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lesson.knowledgeReviewCards.map((card, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm text-amber-950">
                  <span className="text-xl">{card.icon || '💡'}</span>
                  <span>{card.title}</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 leading-relaxed">{card.content}</p>
                {card.highlightRule && (
                  <div className="p-2.5 bg-white rounded-xl border border-amber-300 text-xs font-bold text-amber-900">
                    {card.highlightRule}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 text-xs">
            <div className="font-black text-sky-900 mb-1">🎯 Yêu cầu cần đạt sau bài học:</div>
            <ul className="list-disc list-inside space-y-1 font-semibold text-sky-800">
              {lesson.learningGoals.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setActiveActivity('basic')}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition active:scale-95"
            >
              Bé đã hiểu bài, bắt đầu làm bài tập thôi nào! 🚀
            </button>
          </div>
        </div>
      )}

      {/* ================= 5. HOẠT ĐỘNG: TRÒ CHƠI TOÁN HỌC ================= */}
      {activeActivity === 'game' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-3 border-amber-200 shadow-md text-center space-y-6 animate-pop">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 font-black text-xs">
            <Gamepad2 className="w-4 h-4 text-amber-700" />
            <span>Trò Chơi: Đập Bong Bóng Tìm Số Chuẩn</span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-900">{gameMessage}</h2>

          <div className="flex justify-center items-center gap-4 py-6 flex-wrap">
            {bubbleNumbers.map((num, i) => (
              <button
                key={i}
                onClick={() => handleBubbleClick(num)}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-sky-400 via-amber-300 to-pink-300 text-slate-900 font-black text-2xl sm:text-3xl shadow-xl hover:scale-110 active:scale-95 transition-transform flex items-center justify-center border-4 border-white/80 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {num}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 text-xs font-black text-slate-600">
            <div>
              Điểm trò chơi: <span className="text-amber-600 text-lg font-black">{gameScore} đ</span>
            </div>
            <button
              onClick={initGame}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
            >
              Đổi vòng chơi mới 🔄
            </button>
          </div>
        </div>
      )}

      {/* ================= BÀI TẬP (CƠ BẢN / CỦNG CỐ / VẬN DỤNG / NÂNG CAO) ================= */}
      {activeActivity !== 'review' && activeActivity !== 'game' && !isFinished && currentQ && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-3 border-amber-100 shadow-xl space-y-6 animate-pop">
          {/* Progress Bar & Counter (Phần 6) */}
          <div className="flex items-center justify-between text-xs font-black text-slate-500">
            <div className="flex items-center gap-2">
              <span className="text-amber-600">Câu hỏi {currentQIndex + 1} / {activeQuestions.length}</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-bold">{correctAnswersCount} đúng</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{correctAnswersCount * 10} điểm</span>
            </div>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
              style={{ width: `${((currentQIndex + 1) / activeQuestions.length) * 100}%` }}
            ></div>
          </div>

          {/* Question Text */}
          <div className="p-4 sm:p-5 bg-amber-50/50 rounded-2xl border-2 border-amber-200">
            <div className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {currentQ.question}
            </div>
            {currentQ.visualIllustration && (
              <div className="mt-3 text-2xl font-black text-amber-700 p-2 bg-white rounded-xl inline-block border border-amber-200">
                {currentQ.visualIllustration}
              </div>
            )}
          </div>

          {/* Answer Options: Multiple Choice */}
          {currentQ.type === 'multiple_choice' && currentQ.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                let btnStyle = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800';

                if (isAnswerChecked) {
                  if (opt === currentQ.correctAnswer) {
                    btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-black shadow-xs';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-50 border-rose-400 text-rose-800 font-bold';
                  }
                } else if (isSelected) {
                  btnStyle = 'bg-amber-100 border-amber-500 text-amber-950 font-black shadow-xs';
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerChecked}
                    onClick={() => {
                      setSelectedOption(opt);
                      soundFx.playClick();
                    }}
                    className={`p-4 rounded-2xl border-2 text-left text-sm sm:text-base font-bold transition-all duration-150 flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswerChecked && opt === currentQ.correctAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {isAnswerChecked && isSelected && opt !== currentQ.correctAnswer && (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Answer Input: Fill in blank */}
          {currentQ.type === 'fill_in_blank' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="text-xs font-black text-slate-700 block mb-2">
                Nhập đáp án của em vào đây:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  disabled={isAnswerChecked}
                  value={fillBlankInput}
                  onChange={(e) => setFillBlankInput(e.target.value)}
                  placeholder="Ví dụ: 45"
                  className="flex-1 p-3 bg-white border-2 border-slate-300 rounded-xl font-black text-base text-slate-900 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Step-by-Step Hint Drawer (Phần 3 & 5) */}
          {showHint && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl animate-pop text-xs">
              <div className="flex items-center gap-2 font-black text-amber-900 mb-1">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>Gợi ý từng bước của Ong Vàng AI:</span>
              </div>
              <p className="font-semibold text-slate-800 leading-relaxed">
                {isLoadingAIHint ? 'Ong Vàng đang suy nghĩ gợi ý cho bé...' : aiHintText}
              </p>
            </div>
          )}

          {/* Explanation when answered */}
          {isAnswerChecked && (
            <div
              className={`p-4 rounded-2xl border-2 animate-pop text-xs font-bold ${
                (selectedOption === currentQ.correctAnswer ||
                  (currentQ.type === 'fill_in_blank' &&
                    (currentQ.acceptableAnswers || [currentQ.correctAnswer]).includes(fillBlankInput.trim())))
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-sm font-black">
                {selectedOption === currentQ.correctAnswer ||
                (currentQ.type === 'fill_in_blank' &&
                  (currentQ.acceptableAnswers || [currentQ.correctAnswer]).includes(fillBlankInput.trim())) ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Đúng rồi! Khen ngợi bé rất thông minh! 🎉</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-500" />
                    <span>Chưa chính xác rồi, đừng buồn nhé! Đáp án đúng là: <strong>{currentQ.correctAnswer}</strong></span>
                  </>
                )}
              </div>
              <p className="font-normal text-slate-700 mt-1">{currentQ.explanation}</p>
            </div>
          )}

          {/* Bottom Actions Buttons (Phần 6) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={handleAskAI}
              className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-black text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>Hỏi Bạn Ong Vàng AI 🐝</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!isAnswerChecked ? (
                <button
                  disabled={currentQ.type === 'multiple_choice' ? !selectedOption : !fillBlankInput.trim()}
                  onClick={handleCheckAnswer}
                  className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-sm rounded-2xl shadow-md transition active:scale-95"
                >
                  Kiểm tra đáp án ✨
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>{currentQIndex < activeQuestions.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành bài tập'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MÀN HÌNH HOÀN THÀNH (RESULTS) ================= */}
      {isFinished && (
        <div className="bg-white rounded-3xl p-8 border-4 border-amber-300 shadow-2xl text-center space-y-6 animate-pop">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-5xl shadow-xl shadow-amber-200">
            🏆
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">Chúc Mừng Em Đã Hoàn Thành!</h2>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Bài học: <strong>{lesson.title}</strong> • {getActivityLabel(activeActivity)}
            </p>
          </div>

          {/* Result Cards */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            <div className="p-3 bg-emerald-50 rounded-2xl border-2 border-emerald-200">
              <div className="text-[11px] font-bold text-emerald-700">Câu Đúng</div>
              <div className="text-xl font-black text-emerald-800 mt-1">
                {correctAnswersCount} / {activeQuestions.length}
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border-2 border-amber-200">
              <div className="text-[11px] font-bold text-amber-700">Điểm Đạt Được</div>
              <div className="text-xl font-black text-amber-800 mt-1">
                {Math.round((correctAnswersCount / Math.max(activeQuestions.length, 1)) * 100)}%
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-2xl border-2 border-blue-200">
              <div className="text-[11px] font-bold text-blue-700">Thưởng Thi Đua</div>
              <div className="text-xl font-black text-blue-800 mt-1">
                +{completionResult?.pointsAdded || 0} đ
              </div>
            </div>
          </div>

          {completionResult && !completionResult.isFirstOrImproved && (
            <p className="text-[11px] font-semibold text-slate-500 max-w-sm mx-auto">
              ℹ️ Bé đã hoàn thành bài tập này trước đó rồi! Điểm thi đua chỉ cộng khi bé tiến bộ hơn lần trước nha.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setCurrentQIndex(0);
                setSelectedOption(null);
                setFillBlankInput('');
                setIsAnswerChecked(false);
                setCorrectAnswersCount(0);
                setWrongAnswersCount(0);
                setIsFinished(false);
                soundFx.playClick();
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Luyện tập lại</span>
            </button>

            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition"
            >
              Chọn bài học khác 📚
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
