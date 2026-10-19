import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { soundFx } from '../utils/sound';
import { Bot, Send, Volume2, Sparkles, Lightbulb, MessageCircle, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export const AIAssistantBot: React.FC = () => {
  const { currentStudent, currentClass } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'bot',
      text: `Chào bạn nhỏ ${currentStudent?.name || ''}! Tớ là Bạn Ong Vàng AI 🐝 của trạm học tập thông minh AI LEARN. Hôm nay bạn gặp khó khăn ở bài Toán hay Tiếng Việt nào? Tớ sẽ gợi ý từng bước để bạn tự tìm ra câu trả lời nhé! ⭐`,
      time: 'Vừa xong',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Quick prompt chips
  const quickChips = [
    'Ong Vàng ơi, vì sao phép cộng 38 + 25 lại phải nhớ 1?',
    'Làm thế nào để phân biệt từ chỉ đặc điểm với từ chỉ hoạt động?',
    'Kim ngắn chỉ số 4, kim dài chỉ số 6 là mấy giờ hả bạn?',
    'Đố Ong Vàng một câu đố vui toán học lớp 2!',
    'Chỉ tớ mẹo viết đúng chính tả chữ "ch" và "tr" với!',
  ];

  // Text to speech for 2nd graders
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.95; // Gentle pace for children
      window.speechSynthesis.speak(utterance);
    }
    soundFx.playClick();
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputText).trim();
    if (!textToSend || isLoading) return;

    soundFx.playClick();
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: 'Bây giờ',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          subject: 'Toán & Tiếng Việt lớp 2',
        }),
      });
      const data = await res.json();
      const botResponseText =
        data.hint ||
        'Ong Vàng khen bạn đã rất nỗ lực suy nghĩ! Hãy nhớ lại bài học trên lớp và thử từng bước một nhé! ⭐🐝';

      const botMsg: ChatMessage = {
        id: `b_${Date.now()}`,
        sender: 'bot',
        text: botResponseText,
        time: 'Bây giờ',
      };
      setMessages((prev) => [...prev, botMsg]);
      soundFx.playCorrect();
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `b_${Date.now()}`,
        sender: 'bot',
        text: 'Ong Vàng luôn ở bên bạn! Hãy đọc lại đề bài thật chậm và suy nghĩ từng bước nhé, bạn nhất định làm được! 🌟',
        time: 'Bây giờ',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Bot Persona Banner */}
      <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 rounded-3xl p-5 sm:p-6 shadow-xl border-3 border-amber-200 mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/90 shadow-md flex items-center justify-center text-4xl sm:text-5xl animate-float">
            🐝
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-950 bg-amber-500/20 px-2.5 py-0.5 rounded-full mb-1">
              <Sparkles className="w-3 h-3" />
              Bạn Học Thông Minh Lớp 2
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Bạn Ong Vàng AI
            </h1>
            <p className="text-xs font-semibold text-slate-700">
              Gợi ý từng bước thông minh • Không đưa đáp án ngay • Giúp bạn tự hiểu bài
            </p>
          </div>
        </div>

        <div className="hidden md:block text-right">
          <div className="text-xs font-bold text-slate-700">Chế độ bảo vệ an toàn:</div>
          <div className="text-[11px] font-black text-emerald-800">✅ Không lưu thông tin cá nhân</div>
        </div>
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="mb-4">
        <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Gợi ý câu hỏi thường gặp của các bạn {currentClass?.name || 'lớp 2'}:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 transition text-left shadow-2xs"
            >
              💬 {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Box */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border-3 border-slate-100 shadow-xl min-h-[360px] max-h-[500px] overflow-y-auto flex flex-col gap-4 mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-amber-100 border border-amber-300 text-amber-800'
              }`}
            >
              {msg.sender === 'user' ? (currentStudent?.avatar || '👦') : '🐝'}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm font-semibold leading-relaxed shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-xs'
                  : 'bg-amber-50/70 border border-amber-200 text-slate-800 rounded-tl-xs'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>

              {msg.sender === 'bot' && (
                <div className="mt-2.5 pt-2 border-t border-amber-200/50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">{msg.time}</span>
                  <button
                    onClick={() => handleSpeak(msg.text)}
                    className="p-1 rounded-lg hover:bg-amber-100 text-amber-800 transition flex items-center gap-1 text-[11px] font-bold"
                    title="Đọc to cho bé nghe"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Nghe Ong Vàng đọc</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-xl">
              🐝
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs font-bold text-amber-800 flex items-center gap-2">
              <span className="animate-spin text-sm">⏳</span>
              <span>Ong Vàng đang suy nghĩ lời gợi ý hay nhất cho bạn...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Message Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Nhập câu hỏi hoặc bài toán em đang vướng mắc..."
          className="flex-1 px-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-hidden font-bold text-xs sm:text-sm text-slate-800 bg-white"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="px-6 sm:px-8 py-3.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-slate-900 font-black rounded-2xl shadow-md transition flex items-center gap-1.5 active:scale-95"
        >
          <span>Gửi</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
