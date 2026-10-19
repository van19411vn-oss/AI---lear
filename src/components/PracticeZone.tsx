import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Question, Subject, Topic } from '../types';
import { soundFx } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Bot,
  Lightbulb,
  Award,
  ChevronRight,
  BookOpen,
  Calculator,
} from 'lucide-react';

import { CurriculumExplorer } from './curriculum/CurriculumExplorer';

interface Props {
  onGoToAIBot?: () => void;
  onGoToLeaderboard?: () => void;
}

export const PracticeZone: React.FC<Props> = ({ onGoToAIBot, onGoToLeaderboard }) => {
  const { currentStudent, topics, questions, completeQuizSession } = useApp();

  const [selectedSubject, setSelectedSubject] = useState<Subject>('math');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [learningMode, setLearningMode] = useState<'curriculum' | 'custom_topics'>('curriculum');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // In-quiz states
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [aiHintText, setAiHintText] = useState<string>('');
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [lastEarnedResult, setLastEarnedResult] = useState<{ pointsAdded: number; newBadge?: string } | null>(null);

  // Filter topics
  const currentTopics = topics.filter((t) => t.subject === selectedSubject);

  // Filter questions for chosen topic
  const activeQuestions = selectedTopic
    ? questions.filter((q) => q.topicId === selectedTopic.id && q.isApprovedByTeacher)
    : [];

  const currentQ: Question | undefined = activeQuestions[currentQuestionIndex];

  // Start a topic quiz
  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setShowHint(false);
    setAiHintText('');
    setCorrectCount(0);
    setIsQuizCompleted(false);
    setLastEarnedResult(null);
    soundFx.playClick();
  };

  // Check student answer
  const handleCheckAnswer = () => {
    if (!currentQ || selectedOption === null) return;

    setIsAnswerChecked(true);
    const isRight = selectedOption.trim() === (currentQ.correctAnswer || '').trim();

    if (isRight) {
      soundFx.playCorrect();
      setCorrectCount((prev) => prev + 1);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#F59E0B', '#3B82F6', '#10B981'],
      });
    } else {
      soundFx.playEncourage();
    }
  };

  // Ask AI for a step-by-step hint without giving direct answer
  const handleAskAIHint = async () => {
    if (!currentQ) return;
    setShowHint(true);

    if (currentQ.hint) {
      setAiHintText(currentQ.hint);
      return;
    }

    setIsLoadingHint(true);
    try {
      const res = await fetch('/api/ai/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          options: currentQ.options || [],
          selectedWrongAnswer: selectedOption,
          subject: selectedSubject === 'math' ? 'Toán' : 'Tiếng Việt',
          topic: selectedTopic?.name,
        }),
      });
      const data = await res.json();
      setAiHintText(data.hint || currentQ.hint || 'Hãy đọc thật kỹ đề bài và đếm từng bước nhé!');
    } catch {
      setAiHintText(currentQ.hint || 'Hãy đọc kỹ lại câu hỏi và thử từng lựa chọn nhé!');
    } finally {
      setIsLoadingHint(false);
    }
  };

  // Advance to next question or complete quiz
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < activeQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
      setShowHint(false);
      setAiHintText('');
      soundFx.playClick();
    } else {
      // Complete quiz
      const total = activeQuestions.length;
      const finalCorrect = correctCount + (selectedOption === currentQ?.correctAnswer ? 0 : 0);
      const points = finalCorrect * 15;
      const stars = finalCorrect;

      const result = completeQuizSession({
        subject: selectedSubject,
        topicId: selectedTopic!.id,
        total,
        correct: finalCorrect,
        pointsEarned: points,
        starsEarned: stars,
      });

      setLastEarnedResult(result);
      setIsQuizCompleted(true);
      soundFx.playFanfare();
      confetti({
        particleCount: 90,
        spread: 90,
        origin: { y: 0.6 },
      });
    }
  };

  // Return to topic selection
  const handleExitQuiz = () => {
    setSelectedTopic(null);
    setIsQuizCompleted(false);
    soundFx.playClick();
  };

  // If a topic is active, show the quiz runner
  if (selectedTopic && activeQuestions.length > 0) {
    if (isQuizCompleted) {
      return (
        <div className="max-w-2xl mx-auto py-8 px-4 animate-pop">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-amber-300 text-center relative overflow-hidden">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-5xl shadow-lg shadow-amber-200 mb-4 animate-bounce">
              🎉
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-1">
              Tuyệt Vời Lắm Bạn Nhỏ Ơi!
            </h2>
            <p className="text-sm font-semibold text-slate-500 mb-6">
              Bạn vừa hoàn thành xuất sắc chủ đề: <span className="text-blue-600 font-bold">{selectedTopic.name}</span>
            </p>

            {/* Score Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-3">
                <div className="text-xs font-bold text-blue-600">Đúng</div>
                <div className="text-2xl font-black text-blue-700">
                  {correctCount}/{activeQuestions.length}
                </div>
              </div>
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3">
                <div className="text-xs font-bold text-amber-600">Điểm thưởng</div>
                <div className="text-2xl font-black text-amber-700">
                  +{lastEarnedResult?.pointsAdded || correctCount * 15} 🏆
                </div>
              </div>
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-3">
                <div className="text-xs font-bold text-yellow-600">Sao nhận được</div>
                <div className="text-2xl font-black text-yellow-700">+{correctCount} ⭐</div>
              </div>
            </div>

            {/* Badge Unlocked Notification if any */}
            {lastEarnedResult?.newBadge && (
              <div className="bg-gradient-to-r from-amber-100 to-yellow-200 border-2 border-amber-400 rounded-2xl p-4 mb-6 flex items-center gap-3 text-left">
                <span className="text-3xl">🎖️</span>
                <div>
                  <div className="text-xs font-extrabold uppercase text-amber-800">Mở khóa huy hiệu mới!</div>
                  <div className="text-base font-black text-slate-900">{lastEarnedResult.newBadge}</div>
                </div>
              </div>
            )}

            {/* Teacher note of encouragement */}
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs font-semibold text-sky-800 mb-6 flex items-center gap-2 text-left">
              <span className="text-2xl">👩‍🏫</span>
              <span>
                Cô Lan gửi lời khen: &quot;Em đã rất tập trung và cố gắng trong từng câu hỏi. Mỗi ngày một tiến bộ nhé!&quot;
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleSelectTopic.bind(null, selectedTopic)}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-2xl transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5 text-slate-600" />
                Luyện tập lại
              </button>
              <button
                onClick={handleExitQuiz}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-200 transition flex items-center justify-center gap-2 active:scale-98"
              >
                Chọn bài khác
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Active Question Runner
    const isCorrect = selectedOption === currentQ?.correctAnswer;

    return (
      <div className="max-w-2xl mx-auto py-6 px-4">
        {/* Progress & Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleExitQuiz}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs"
          >
            ← Đổi bài
          </button>
          <div className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Câu {currentQuestionIndex + 1} / {activeQuestions.length}
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-3 border-sky-200 relative">
          {/* Difficulty pill */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
              {currentQ.difficulty === 'easy'
                ? '⭐ Mức 1: Khởi động'
                : currentQ.difficulty === 'medium'
                ? '⭐⭐ Mức 2: Tăng tốc'
                : '⭐⭐⭐ Mức 3: Về đích'}
            </span>
            <span className="text-xs font-bold text-slate-400">{selectedTopic.name}</span>
          </div>

          {/* Visual illustration */}
          {currentQ.visualIllustration && (
            <div className="my-3 py-3 px-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center text-lg sm:text-xl font-bold text-slate-700">
              {currentQ.visualIllustration}
            </div>
          )}

          {/* Main Question Text */}
          <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-relaxed mb-6">
            {currentQ.question}
          </h3>

          {/* Answer Options Grid */}
          <div className="space-y-3 mb-6">
            {(currentQ.options || []).map((opt, idx) => {
              const isSelected = selectedOption === opt;
              let btnStyle = 'bg-slate-50 border-2 border-slate-200 text-slate-800 hover:bg-blue-50 hover:border-blue-300';

              if (isAnswerChecked) {
                if (opt === currentQ.correctAnswer) {
                  btnStyle = 'bg-emerald-50 border-3 border-emerald-500 text-emerald-900 font-black shadow-md shadow-emerald-100';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-50 border-3 border-rose-400 text-rose-900 font-bold';
                } else {
                  btnStyle = 'bg-slate-50 border border-slate-200 text-slate-400 opacity-60';
                }
              } else if (isSelected) {
                btnStyle = 'bg-blue-50 border-3 border-blue-600 text-blue-900 font-black shadow-md shadow-blue-100 scale-101';
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswerChecked}
                  onClick={() => {
                    setSelectedOption(opt);
                    soundFx.playClick();
                  }}
                  className={`w-full text-left p-4 rounded-2xl text-base sm:text-lg font-bold transition-all duration-150 flex items-center justify-between active:scale-98 ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-white/90 border border-slate-200 flex items-center justify-center font-black text-sm text-slate-600 shadow-xs">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {isAnswerChecked && opt === currentQ.correctAnswer && (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  )}
                  {isAnswerChecked && isSelected && opt !== currentQ.correctAnswer && (
                    <XCircle className="w-6 h-6 text-rose-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & AI Hint Section */}
          {isAnswerChecked && (
            <div className={`p-4 rounded-2xl border-2 mb-6 animate-pop ${
              isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
              <div className="flex items-center gap-2 font-black text-base mb-1">
                {isCorrect ? (
                  <>
                    <span className="text-xl">🌟</span>
                    <span>Chính xác rồi! Bạn giỏi quá!</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl">💡</span>
                    <span>Chưa đúng rồi! Đừng buồn nhé, xem giải thích này:</span>
                  </>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold leading-relaxed mt-1">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Hint from Ong Vàng AI button */}
          {!isAnswerChecked && (
            <div className="mb-6">
              {!showHint ? (
                <button
                  onClick={handleAskAIHint}
                  className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold text-xs sm:text-sm rounded-2xl border-2 border-amber-200 flex items-center justify-center gap-2 transition"
                >
                  <Bot className="w-4 h-4 text-amber-600" />
                  <span>Cần gợi ý? Bấm đây để hỏi Bạn Ong Vàng AI 🐝</span>
                </button>
              ) : (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-left animate-pop">
                  <div className="flex items-center gap-2 font-black text-xs text-amber-800 mb-1">
                    <span className="text-lg">🐝</span>
                    <span>Gợi ý từ Bạn Ong Vàng AI:</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-amber-900 leading-relaxed">
                    {isLoadingHint ? 'Đang lắng nghe câu hỏi của bạn...' : aiHintText || currentQ.hint}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Button: Check Answer or Next Question */}
          <div className="flex justify-end">
            {!isAnswerChecked ? (
              <button
                disabled={selectedOption === null}
                onClick={handleCheckAnswer}
                className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-base rounded-2xl shadow-md shadow-blue-200 transition active:scale-98"
              >
                Kiểm tra kết quả 🎯
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-base rounded-2xl shadow-lg shadow-blue-200 transition flex items-center justify-center gap-2 active:scale-98"
              >
                <span>{currentQuestionIndex + 1 < activeQuestions.length ? 'Câu tiếp theo' : 'Xem kết quả'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Topic Selection Dashboard
  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Mode Switcher: SGK Kết Nối Tri Thức vs Luyện Đề Nhanh */}
      <div className="flex items-center justify-center">
        <div className="bg-white p-1.5 rounded-2xl border-2 border-amber-200 shadow-md flex items-center gap-2 max-w-xl w-full">
          <button
            onClick={() => {
              setLearningMode('curriculum');
              soundFx.playClick();
            }}
            className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 ${
              learningMode === 'curriculum'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-102 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>📚</span>
            <span>SGK Kết Nối Tri Thức (Lớp 2)</span>
          </button>

          <button
            onClick={() => {
              setLearningMode('custom_topics');
              soundFx.playClick();
            }}
            className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 ${
              learningMode === 'custom_topics'
                ? 'bg-blue-600 text-white shadow-md scale-102 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>⚡</span>
            <span>Luyện Đề Tự Chọn</span>
          </button>
        </div>
      </div>

      {learningMode === 'curriculum' ? (
        <CurriculumExplorer />
      ) : (
        <>
          {/* Welcome Banner for Student */}
          <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-100 mb-8 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 text-8xl sm:text-9xl opacity-20 select-none">
              {selectedSubject === 'math' ? '🧮' : '📖'}
            </div>
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-black uppercase tracking-wider text-amber-300 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI LEARN – Trạm Học Tập Thông Minh
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-2">
            Chào mừng {currentStudent?.name || 'bạn nhỏ'} đến với góc Luyện Tập!
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-blue-100 mb-5 leading-relaxed">
            Mỗi bài luyện tập hoàn thành sẽ tặng bạn 15 điểm thưởng và những Ngôi Sao Tiến Bộ lấp lánh ⭐. Hãy chọn môn học để bắt đầu nhé!
          </p>

          {/* Subject Switcher Buttons */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                setSelectedSubject('math');
                soundFx.playClick();
              }}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition flex items-center gap-2 shadow-xs ${
                selectedSubject === 'math'
                  ? 'bg-amber-400 text-slate-900 shadow-md scale-102 font-extrabold'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <Calculator className="w-4 h-4" />
              Toán Lớp 2 📐
            </button>
            <button
              onClick={() => {
                setSelectedSubject('vietnamese');
                soundFx.playClick();
              }}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition flex items-center gap-2 shadow-xs ${
                selectedSubject === 'vietnamese'
                  ? 'bg-amber-400 text-slate-900 shadow-md scale-102 font-extrabold'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Tiếng Việt Lớp 2 📖
            </button>
          </div>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              Chủ đề {selectedSubject === 'math' ? 'Toán học' : 'Tiếng Việt'}
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Chọn chủ đề em muốn luyện tập hôm nay
            </p>
          </div>
          <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            {currentTopics.length} chủ đề chính
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {currentTopics.map((topic) => {
            const topicQuestions = questions.filter(
              (q) => q.topicId === topic.id && q.isApprovedByTeacher
            );

            return (
              <div
                key={topic.id}
                onClick={() => handleSelectTopic(topic)}
                className="bg-white rounded-3xl p-5 border-3 border-slate-100 hover:border-amber-300 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl p-2.5 rounded-2xl bg-amber-50 border border-amber-200 group-hover:scale-110 transition-transform">
                      {topic.icon}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                      {topicQuestions.length} câu hỏi
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors mb-1.5">
                    {topic.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold line-clamp-2 mb-4">
                    {topic.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                    <span>🎖️</span>
                    <span>{topic.badgeReward}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-black text-blue-600 group-hover:translate-x-1 transition-transform">
                    <span>Luyện ngay</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </>
      )}
    </div>
  );
};
