import React, { useState, useEffect } from 'react';
import { CurriculumLesson, VietActivityType, CurriculumQuestion } from '../../types/curriculum';
import { useApp } from '../../context/AppContext';
import { soundFx } from '../../utils/sound';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  ArrowLeft,
  Sparkles,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Check,
  Award,
  ChevronRight,
  Bot,
  Lightbulb,
  FileText,
  Star,
  Send,
} from 'lucide-react';

interface Props {
  lesson: CurriculumLesson;
  onBack: () => void;
}

export const VietnameseLessonPlayer: React.FC<Props> = ({ lesson, onBack }) => {
  const { currentStudent, recordLessonCompletion } = useApp();

  const [activeActivity, setActiveActivity] = useState<VietActivityType>('reading');
  const [questions, setQuestions] = useState<CurriculumQuestion[]>(lesson.defaultQuestions);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // In-question states
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [fillBlankInput, setFillBlankInput] = useState('');
  const [writingInput, setWritingInput] = useState('');
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [aiHintText, setAiHintText] = useState('');
  const [isLoadingAIHint, setIsLoadingAIHint] = useState(false);
  const [isGeneratingNewAI, setIsGeneratingNewAI] = useState(false);
  const [isSpeakingPassage, setIsSpeakingPassage] = useState(false);

  // Word Ordering activity state (Sắp xếp từ thành câu)
  const [selectedWordsForSentence, setSelectedWordsForSentence] = useState<string[]>([]);

  // Score & Progress states
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [completionResult, setCompletionResult] = useState<{
    pointsAdded: number;
    starsAdded: number;
    isFirstOrImproved: boolean;
  } | null>(null);

  // Filter questions for active activity
  const activeQuestions = questions.filter(
    (q) => q.activityType === activeActivity || (activeActivity === 'comprehension' && q.activityType === 'comprehension')
  );
  const currentQ = activeQuestions[currentQIndex] || questions[0];

  // Activities available for this lesson
  const availableActivities: VietActivityType[] = lesson.vietnameseActivities || [
    'reading',
    'comprehension',
    'vocabulary',
    'sentence_types',
    'spelling',
    'writing',
  ];

  useEffect(() => {
    setCurrentQIndex(0);
    setSelectedOption(null);
    setFillBlankInput('');
    setWritingInput('');
    setSelectedWordsForSentence([]);
    setIsAnswerChecked(false);
    setShowHint(false);
    setAiHintText('');
    setCorrectAnswersCount(0);
    setIsFinished(false);
    setCompletionResult(null);
  }, [activeActivity]);

  // Read aloud passage using Web Speech API (Giọng đọc tiếng Việt cho học sinh lớp 2)
  const handleReadPassageAloud = () => {
    if (!lesson.readingPassage) return;
    if ('speechSynthesis' in window) {
      if (isSpeakingPassage) {
        window.speechSynthesis.cancel();
        setIsSpeakingPassage(false);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(lesson.readingPassage.content);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.85; // Slow and clear for Grade 2
      utterance.onend = () => setIsSpeakingPassage(false);
      utterance.onerror = () => setIsSpeakingPassage(false);

      setIsSpeakingPassage(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Trình duyệt của bạn chưa hỗ trợ giọng đọc tiếng Việt.');
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
    } else if (activeActivity === 'writing') {
      // Writing short answer or sentences (at least 5 characters)
      isCorrect = writingInput.trim().length >= 8;
    }

    if (isCorrect) {
      soundFx.playCorrect();
      setCorrectAnswersCount((prev) => prev + 1);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#3B82F6', '#10B981', '#EC4899'],
      });
    } else {
      soundFx.playEncourage();
    }
  };

  // Next question or finish
  const handleNextQuestion = () => {
    soundFx.playClick();
    if (currentQIndex < activeQuestions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setFillBlankInput('');
      setSelectedWordsForSentence([]);
      setIsAnswerChecked(false);
      setShowHint(false);
      setAiHintText('');
    } else {
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
      subject: 'vietnamese',
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
          subject: 'Tiếng Việt lớp 2',
          topic: lesson.title,
        }),
      });
      const data = await res.json();
      setAiHintText(data.hint || 'Ong Vàng khuyên con đọc kỹ lại đoạn văn trong bài nhé! 🐝');
    } catch {
      setAiHintText('Ong Vàng nhắc con: Hãy đọc lại câu văn và chú ý từ ngữ quen thuộc nhé! 💡');
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
          subject: 'vietnamese',
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
          id: `ai_qv_${Date.now()}_${i}`,
          activityType: activeActivity,
          type: 'multiple_choice',
          points: 10,
        }));
        setQuestions(mapped);
        setCurrentQIndex(0);
        setSelectedOption(null);
        setIsAnswerChecked(false);
        setCorrectAnswersCount(0);
        setIsFinished(false);
        soundFx.playCorrect();
      }
    } catch {
      alert('Chưa thể kết nối AI, đang dùng câu hỏi chuẩn!');
    } finally {
      setIsGeneratingNewAI(false);
    }
  };

  const getActivityLabel = (type: VietActivityType) => {
    switch (type) {
      case 'reading':
        return '1. Đọc hiểu bài đọc';
      case 'comprehension':
        return '2. Trả lời câu hỏi';
      case 'vocabulary':
        return '3. Mở rộng vốn từ';
      case 'sentence_types':
        return '4. Nhận biết từ ngữ & kiểu câu';
      case 'spelling':
        return '5. Chính tả';
      case 'word_order':
        return '6. Sắp xếp từ thành câu';
      case 'sentence_order':
        return '7. Sắp xếp câu thành đoạn';
      case 'writing':
        return '8. Luyện viết câu / đoạn ngắn';
      case 'speaking_listening':
        return '9. Nói và nghe';
    }
  };

  const activityIcons: Record<VietActivityType, string> = {
    reading: '📖',
    comprehension: '❓',
    vocabulary: '🌟',
    sentence_types: '🧩',
    spelling: '✍️',
    word_order: '🔀',
    sentence_order: '📑',
    writing: '📝',
    speaking_listening: '🔊',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-pop">
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-500 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative">
        <div className="flex items-center justify-between gap-3 mb-3">
          <button
            onClick={onBack}
            className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại bài học</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[11px] font-black uppercase text-amber-300">
              Tiếng Việt Lớp 2 • Tập {lesson.volume}
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold">
              SGK Kết nối tri thức
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black text-blue-200 uppercase tracking-wider mb-1">
              {lesson.themeName}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">{lesson.title}</h1>
          </div>

          <button
            onClick={handleGenerateAIQuiz}
            disabled={isGeneratingNewAI}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-black text-xs rounded-2xl shadow-md transition flex items-center gap-2 active:scale-95"
            title="Nhờ AI tạo thêm bộ câu hỏi mới cho bài này"
          >
            <Bot className="w-4 h-4" />
            <span>{isGeneratingNewAI ? 'Đang tạo câu hỏi...' : 'AI Soạn Thêm Bài Tập ✨'}</span>
          </button>
        </div>
      </div>

      {/* Hoạt Động Học Tập Phù Hợp Cho Bài Này (Phần 4: Chỉ hiển thị dạng bài phù hợp) */}
      <div className="bg-white rounded-2xl p-2 border-2 border-blue-200 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {availableActivities.map((type) => {
          const isActive = activeActivity === type;
          return (
            <button
              key={type}
              onClick={() => {
                setActiveActivity(type);
                soundFx.playClick();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md scale-102'
                  : 'text-slate-600 hover:bg-blue-50 hover:text-blue-900'
              }`}
            >
              <span>{activityIcons[type]}</span>
              <span>{getActivityLabel(type).split('. ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* ================= 1. HOẠT ĐỘNG: ĐỌC HIỂU BÀI ĐỌC ================= */}
      {activeActivity === 'reading' && lesson.readingPassage && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-3 border-blue-100 shadow-md space-y-6 animate-pop">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase text-blue-700 bg-blue-50 border border-blue-200 mb-1">
                📖 Văn Bản Bài Đọc
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {lesson.readingPassage.title}
              </h2>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                {lesson.readingPassage.authorOrNotice}
              </p>
            </div>

            <button
              onClick={handleReadPassageAloud}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition shadow-xs ${
                isSpeakingPassage
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isSpeakingPassage ? 'Dừng đọc ⏹️' : 'Nghe cô đọc bài 🔊'}</span>
            </button>
          </div>

          {/* Reading passage content */}
          <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200 text-sm sm:text-base font-semibold text-slate-800 leading-loose whitespace-pre-line tracking-wide">
            {lesson.readingPassage.content}
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs">
            <div className="font-black text-amber-900 mb-1 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>Gợi ý luyện đọc cho bé:</span>
            </div>
            <p className="font-semibold text-amber-800">
              Đọc to, rõ ràng, ngắt nghỉ đúng dấu chấm, dấu phẩy và giọng vui tươi, diễn cảm nhé!
            </p>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setActiveActivity('comprehension')}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-lg transition active:scale-95"
            >
              Em đã đọc xong, trả lời câu hỏi đọc hiểu 🚀
            </button>
          </div>
        </div>
      )}

      {/* ================= 8. HOẠT ĐỘNG: LUYỆN VIẾT CÂU HOẶC ĐOẠN NGẮN ================= */}
      {activeActivity === 'writing' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-3 border-blue-100 shadow-md space-y-5 animate-pop">
          <div className="flex items-center gap-2 font-black text-base text-slate-900">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Luyện Viết Câu Hoặc Đoạn Văn Ngắn (Lớp 2)</span>
          </div>

          <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200">
            <div className="text-sm font-black text-blue-950 mb-1">Đề bài:</div>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              Viết 1–2 câu nói về cảm xúc của em hoặc một hoạt động em yêu thích trong bài học &quot;{lesson.title}&quot;.
            </p>
          </div>

          <textarea
            rows={4}
            value={writingInput}
            onChange={(e) => setWritingInput(e.target.value)}
            placeholder="Ví dụ: Em rất vui khi được đi học cùng các bạn. Lớp học của em luôn tràn ngập tiếng cười..."
            className="w-full p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-blue-500"
          />

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-bold">{writingInput.length} ký tự</span>
            <button
              onClick={() => {
                if (writingInput.trim().length < 8) {
                  alert('Em hãy viết câu dài hơn một chút (ít nhất 1 câu hoàn chỉnh) nhé! 🌸');
                  return;
                }
                soundFx.playCorrect();
                setCorrectAnswersCount(1);
                handleFinishActivity();
              }}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Nộp bài viết cho cô 📝</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= BÀI TẬP TRẮC NGHIỆM / ĐIỀN TỪ (CÂU HỎI ĐỌC HIỂU, TỪ VỰNG, CHÍNH TẢ, KIỂU CÂU) ================= */}
      {activeActivity !== 'reading' && activeActivity !== 'writing' && !isFinished && currentQ && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-3 border-blue-100 shadow-xl space-y-6 animate-pop">
          {/* Progress Bar & Counter */}
          <div className="flex items-center justify-between text-xs font-black text-slate-500">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">Câu hỏi {currentQIndex + 1} / {activeQuestions.length}</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-bold">{correctAnswersCount} đúng</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{correctAnswersCount * 10} điểm</span>
            </div>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-sky-400 transition-all duration-300"
              style={{ width: `${((currentQIndex + 1) / activeQuestions.length) * 100}%` }}
            ></div>
          </div>

          {/* Question Text */}
          <div className="p-4 sm:p-5 bg-blue-50/50 rounded-2xl border-2 border-blue-200">
            <div className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {currentQ.question}
            </div>
          </div>

          {/* Answer Options */}
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
                  btnStyle = 'bg-blue-100 border-blue-500 text-blue-950 font-black shadow-xs';
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

          {/* Fill Blank Input */}
          {currentQ.type === 'fill_in_blank' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="text-xs font-black text-slate-700 block mb-2">
                Nhập câu trả lời của em:
              </label>
              <input
                type="text"
                disabled={isAnswerChecked}
                value={fillBlankInput}
                onChange={(e) => setFillBlankInput(e.target.value)}
                placeholder="Ví dụ: Chăm chỉ"
                className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          )}

          {/* Step-by-step hint */}
          {showHint && (
            <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-2xl animate-pop text-xs">
              <div className="flex items-center gap-2 font-black text-blue-900 mb-1">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                <span>Gợi ý của Bạn Ong Vàng AI:</span>
              </div>
              <p className="font-semibold text-slate-800 leading-relaxed">
                {isLoadingAIHint ? 'Ong Vàng đang suy nghĩ gợi ý cho bé...' : aiHintText}
              </p>
            </div>
          )}

          {/* Explanation when checked */}
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
                    <span>Đúng rồi! Khen ngợi bé rất giỏi! 🎉</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-500" />
                    <span>Chưa đúng rồi! Đáp án chính xác là: <strong>{currentQ.correctAnswer}</strong></span>
                  </>
                )}
              </div>
              <p className="font-normal text-slate-700 mt-1">{currentQ.explanation}</p>
            </div>
          )}

          {/* Bottom Actions Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={handleAskAI}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-black text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Lightbulb className="w-4 h-4 text-blue-600" />
              <span>Hỏi Bạn Ong Vàng AI 🐝</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!isAnswerChecked ? (
                <button
                  disabled={currentQ.type === 'multiple_choice' ? !selectedOption : !fillBlankInput.trim()}
                  onClick={handleCheckAnswer}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-md transition active:scale-95"
                >
                  Kiểm tra đáp án ✨
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>{currentQIndex < activeQuestions.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành bài tập'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MÀN HÌNH HOÀN THÀNH ================= */}
      {isFinished && (
        <div className="bg-white rounded-3xl p-8 border-4 border-blue-300 shadow-2xl text-center space-y-6 animate-pop">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-blue-500 to-sky-400 flex items-center justify-center text-5xl shadow-xl shadow-blue-200">
            🌟
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">Em Làm Bài Tiếng Việt Rất Tốt!</h2>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Bài học: <strong>{lesson.title}</strong> • {getActivityLabel(activeActivity)}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            <div className="p-3 bg-emerald-50 rounded-2xl border-2 border-emerald-200">
              <div className="text-[11px] font-bold text-emerald-700">Câu Đúng</div>
              <div className="text-xl font-black text-emerald-800 mt-1">
                {correctAnswersCount} / {activeQuestions.length}
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-2xl border-2 border-blue-200">
              <div className="text-[11px] font-bold text-blue-700">Điểm Đạt Được</div>
              <div className="text-xl font-black text-blue-800 mt-1">
                {Math.round((correctAnswersCount / Math.max(activeQuestions.length, 1)) * 100)}%
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border-2 border-amber-200">
              <div className="text-[11px] font-bold text-amber-700">Thưởng Thi Đua</div>
              <div className="text-xl font-black text-amber-800 mt-1">
                +{completionResult?.pointsAdded || 0} đ
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setCurrentQIndex(0);
                setSelectedOption(null);
                setFillBlankInput('');
                setIsAnswerChecked(false);
                setCorrectAnswersCount(0);
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
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition"
            >
              Chọn bài học khác 📚
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
