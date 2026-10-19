import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Shared GoogleGenAI client (Telemetry User-Agent 'aistudio-build' as required)
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * 1. POST /api/ai/hint
 * For students: Provide step-by-step guidance without giving away the direct answer.
 * Persona: Ong Vàng AI (warm, friendly, 2nd grade vocabulary).
 */
app.post('/api/ai/hint', async (req: Request, res: Response) => {
  try {
    const { question, options, selectedWrongAnswer, subject, topic } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Thiếu thông tin câu hỏi' });
    }

    if (ai) {
      const prompt = `Bạn là "Ong Vàng AI" - người bạn học tập thân thiết của học sinh lớp 2 (7-8 tuổi) trường Tiểu học 2A10.
Nhiệm vụ của bạn: Gợi ý TỪNG BƯỚC cho bé, TUYỆT ĐỐI KHÔNG NÓI NGAY ĐÁP ÁN ĐÚNG. Hãy dùng lời động viên vui vẻ, dễ thương, câu ngắn gọn, có icon vui nhộn (🐝, ⭐, 💡).
Môn học: ${subject || 'Toán/Tiếng Việt'}
Chủ đề: ${topic || 'Luyện tập'}
Câu hỏi của bé: "${question}"
Các đáp án: ${JSON.stringify(options || [])}
Bé vừa chọn đáp án: "${selectedWrongAnswer || 'chưa biết'}"

Hãy trả lời trong khoảng 2-3 câu ngắn:
1. Khen bé đã cố gắng suy nghĩ.
2. Đặt một câu hỏi gợi mở hoặc nhắc lại quy tắc đơn giản để bé tự nhận ra đáp án đúng.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Bạn là Ong Vàng AI, trợ lý học tập lớp 2 tiểu học vui tính, dùng từ ngữ Việt dễ hiểu cho trẻ 7-8 tuổi.',
          temperature: 0.7,
        },
      });

      return res.json({
        hint: response.text || 'Ong Vàng khen bạn đã rất nỗ lực! Hãy đọc kỹ lại đề bài và đếm từng bước một nhé! ⭐🐝',
      });
    }

    // Fallback if API key is pending
    return res.json({
      hint: `Ong Vàng khen bạn rất chăm chỉ! 🐝 Đừng buồn nhé, bạn thử đọc lại câu hỏi thật kỹ và nhớ lại bài học trên lớp xem sao nha! ⭐`,
    });
  } catch (error: any) {
    console.error('Error generating hint:', error);
    return res.json({
      hint: 'Ong Vàng nhắc bạn: Hãy đọc thật kỹ yêu cầu và thử loại trừ từng đáp án nhé! Cố lên nào! 🌟',
    });
  }
});

/**
 * 2. POST /api/ai/explain
 * Explain why the correct answer is right and celebrate the student's curiosity.
 */
app.post('/api/ai/explain', async (req: Request, res: Response) => {
  try {
    const { question, correctAnswer, subject } = req.body;

    if (!question || !correctAnswer) {
      return res.status(400).json({ error: 'Thiếu thông tin giải thích' });
    }

    if (ai) {
      const prompt = `Bạn là Ong Vàng AI cho học sinh lớp 2 (7-8 tuổi).
Hãy giải thích ngắn gọn, sinh động vì sao đáp án "${correctAnswer}" là chính xác cho câu hỏi: "${question}" (Môn ${subject || 'Toán'}).
Yêu cầu:
- Rất dễ hiểu, từ ngữ đơn giản cho trẻ 7 tuổi.
- Tối đa 2-3 câu ngắn.
- Có biểu tượng vui nhộn (🎉, ✨, 👏).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      return res.json({
        explanation: response.text || `Chính xác rồi! Đáp án là ${correctAnswer}. Bạn làm rất giỏi! 🎉`,
      });
    }

    return res.json({
      explanation: `Tuyệt vời! Đáp án đúng là: ${correctAnswer}. Bạn nhớ ghi nhớ quy tắc này nhé! 🌟`,
    });
  } catch (error: any) {
    console.error('Error generating explanation:', error);
    return res.json({
      explanation: `Đáp án chính xác là ${req.body.correctAnswer}. Bạn học rất tiến bộ! 🎈`,
    });
  }
});

/**
 * 3. POST /api/ai/generate-quiz
 * For teachers: Generate curriculum-aligned Grade 2 questions in JSON format.
 * Teacher MUST review and approve before assigning.
 */
app.post('/api/ai/generate-quiz', async (req: Request, res: Response) => {
  try {
    const { subject, topic, difficulty, count } = req.body;
    const numQuestions = Math.min(Math.max(Number(count) || 3, 1), 5);

    if (ai) {
      const prompt = `Hãy soạn ${numQuestions} câu hỏi trắc nghiệm chương trình LỚP 2 TIỂU HỌC VIỆT NAM (Chương trình GDPT mới).
Môn học: ${subject === 'vietnamese' ? 'Tiếng Việt' : 'Toán'}
Chủ đề: ${topic || 'Tổng hợp kiến thức'}
Mức độ: ${difficulty || 'Cơ bản'} (Dễ / Trung bình / Thử thách)

Yêu cầu định dạng:
Trả về mảng JSON chứa các câu hỏi, mỗi câu hỏi có các trường:
- id: chuỗi id duy nhất ngẫu nhiên (vd: q_ai_1)
- question: nội dung câu hỏi rõ ràng, ngắn gọn, phù hợp học sinh lớp 2
- options: mảng đúng 4 lựa chọn ngắn gọn [A, B, C, D]
- correctAnswer: chuỗi đáp án đúng (phải trùng khớp chính xác 1 trong 4 lựa chọn trong options)
- hint: gợi ý nhẹ nhàng cho bé khi làm sai
- explanation: giải thích ngắn gọn, dễ hiểu vì sao chọn đáp án đó`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                correctAnswer: { type: Type.STRING },
                hint: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ['id', 'question', 'options', 'correctAnswer', 'hint', 'explanation'],
            },
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '[]');
      return res.json({ questions: parsed });
    }

    // High quality predefined fallback questions if AI key is offline
    const fallbackMath = [
      {
        id: `q_ai_${Date.now()}_1`,
        question: 'Tính: 48 + 25 = ?',
        options: ['63', '73', '72', '83'],
        correctAnswer: '73',
        hint: 'Bé nhớ cộng hàng đơn vị trước: 8 + 5 = 13 (viết 3 nhớ 1), rồi cộng tiếp hàng chục nhé! 🐝',
        explanation: 'Ta có: 8 + 5 = 13, viết 3 nhớ 1. 4 + 2 = 6, thêm 1 là 7. Vậy 48 + 25 = 73! 🎉',
      },
      {
        id: `q_ai_${Date.now()}_2`,
        question: 'Một tuần lễ có mấy ngày đi học nếu em được nghỉ thứ Bảy và Chủ nhật?',
        options: ['7 ngày', '5 ngày', '6 ngày', '4 ngày'],
        correctAnswer: '5 ngày',
        hint: 'Một tuần có 7 ngày, bớt đi 2 ngày nghỉ cuối tuần thì còn lại mấy ngày nhỉ? ⭐',
        explanation: 'Cả tuần có 7 ngày, trừ đi 2 ngày nghỉ (thứ Bảy, Chủ nhật) thì còn 5 ngày đi học! 🌟',
      },
    ];

    const fallbackVietnamese = [
      {
        id: `q_ai_${Date.now()}_1`,
        question: 'Từ nào sau đây là từ chỉ ĐẶC ĐIỂM?',
        options: ['Chạy nhảy', 'Xinh xắn', 'Bác sĩ', 'Quyển sách'],
        correctAnswer: 'Xinh xắn',
        hint: 'Từ chỉ đặc điểm là từ nói về màu sắc, hình dáng, tính nết của sự vật em nhé! 🌸',
        explanation: '"Xinh xắn" là từ chỉ đặc điểm vẻ đẹp đáng yêu! 👏',
      },
      {
        id: `q_ai_${Date.now()}_2`,
        question: 'Câu nào dưới đây là câu nêu HOẠT ĐỘNG?',
        options: ['Bầu trời hôm nay rất trong xanh.', 'Bạn Nam đang đọc truyện tranh.', 'Mẹ em là cô giáo hiền.', 'Chiếc bút chì màu vàng.'],
        correctAnswer: 'Bạn Nam đang đọc truyện tranh.',
        hint: 'Tìm câu có từ ngữ chỉ hành động như đọc, viết, vẽ, chạy nhé! 🐝',
        explanation: '"Đang đọc truyện tranh" là hoạt động của bạn Nam! ✨',
      },
    ];

    return res.json({
      questions: subject === 'vietnamese' ? fallbackVietnamese.slice(0, numQuestions) : fallbackMath.slice(0, numQuestions),
    });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    return res.status(500).json({ error: 'Không thể tạo câu hỏi lúc này' });
  }
});

/**
 * 3b. POST /api/ai/generate-curriculum-quiz
 * Generates 5-10 questions strictly aligned with the chosen Grade 2 lesson (SGK Kết nối tri thức).
 * Includes programmatic arithmetic verification for Math.
 */
app.post('/api/ai/generate-curriculum-quiz', async (req: Request, res: Response) => {
  try {
    const {
      subject,
      volume,
      lessonId,
      lessonTitle,
      themeName,
      learningGoals,
      difficulty,
      activityType,
      count,
    } = req.body;

    const numQuestions = Math.min(Math.max(Number(count) || 5, 3), 10);

    if (ai) {
      const prompt = `Bạn là chuyên gia thẩm định chương trình Tiểu học Việt Nam, đặc biệt là bộ sách giáo khoa "KẾT NỐI TRI THỨC VỚI CUỘC SỐNG" Lớp 2.
Nhiệm vụ: Soạn đúng ${numQuestions} câu hỏi luyện tập cho bài học sau:
- Môn: ${subject === 'vietnamese' ? 'Tiếng Việt Lớp 2' : 'Toán Lớp 2'} (Tập ${volume || 1})
- Chủ đề: ${themeName || 'Bài học'}
- Tên bài chính xác: ${lessonTitle}
- Mục tiêu kiến thức cần rèn luyện: ${JSON.stringify(learningGoals || [])}
- Dạng hoạt động: ${activityType || 'Bài tập cơ bản'}
- Mức độ: ${difficulty || 'Cơ bản'} (Dành cho học sinh 7-8 tuổi)

YÊU CẦU NGHIÊM NGẶT:
1. CHỈ tạo câu hỏi thuộc ĐÚNG phạm vi kiến thức bài học đang chọn (Không đưa kiến thức của bài khác hay lớp trên vào).
2. Câu từ ngắn gọn, trong sáng, dễ đọc với trẻ 7 tuổi, dùng hình ảnh minh họa emoji dễ thương (🍎, 🐱, 🌸, 🎈).
3. Với Toán: Đảm bảo phép tính chính xác 100%, có giải thích từng bước.
4. Với Tiếng Việt: Nếu là bài đọc hiểu, đặt câu hỏi sát nghĩa; nếu là chính tả/kiểu câu, kiểm tra đúng quy tắc tiếng Việt.
5. Mỗi câu hỏi phải có:
   - id: chuỗi id duy nhất (vd: "cq_1")
   - question: câu hỏi
   - options: 4 lựa chọn ngắn gọn (với trắc nghiệm)
   - correctAnswer: đáp án đúng duy nhất (phải có trong options)
   - acceptableAnswers: mảng các cách viết tương đương nếu là điền từ (chữ hoa/thường)
   - hint: gợi ý nhẹ nhàng cho bé khi chưa làm được (KHÔNG nói ngay đáp án)
   - explanation: lời giải thích khen ngợi dễ thương khi bé trả lời đúng`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                correctAnswer: { type: Type.STRING },
                acceptableAnswers: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                hint: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ['id', 'question', 'options', 'correctAnswer', 'hint', 'explanation'],
            },
          },
        },
      });

      let questions: any[] = JSON.parse(response.text?.trim() || '[]');

      // Logic verify: For Math arithmetic, verify programmatically!
      if (subject === 'math') {
        questions = questions.map((q) => {
          // Check for pattern like "(\d+)\s*([\+\-\*×\:])\s*(\d+)"
          const match = q.question.match(/(\d+)\s*([\+\-\*×\:])\s*(\d+)/);
          if (match) {
            const num1 = parseInt(match[1], 10);
            const op = match[2];
            const num2 = parseInt(match[3], 10);
            let calculated: number | null = null;
            if (op === '+') calculated = num1 + num2;
            else if (op === '-') calculated = num1 - num2;
            else if (op === '*' || op === '×') calculated = num1 * num2;
            else if (op === ':' && num2 !== 0) calculated = Math.floor(num1 / num2);

            if (calculated !== null) {
              const calcStr = calculated.toString();
              // If options don't have it or correctAnswer is wrong, fix it
              if (!q.options.includes(calcStr)) {
                q.options[0] = calcStr;
              }
              q.correctAnswer = calcStr;
            }
          }
          return q;
        });
      }

      return res.json({ questions, source: 'ai' });
    }

    // Dynamic curriculum generator fallback if AI offline
    const generatedFallback: any[] = [];
    for (let i = 0; i < numQuestions; i++) {
      if (subject === 'math') {
        const a = 12 + i * 5;
        const b = 8 + (i % 3);
        const sum = a + b;
        generatedFallback.push({
          id: `cq_fb_${i + 1}`,
          question: `Em hãy tính: ${a} + ${b} = ?`,
          options: [sum.toString(), (sum - 1).toString(), (sum + 1).toString(), (sum + 10).toString()],
          correctAnswer: sum.toString(),
          acceptableAnswers: [sum.toString()],
          hint: `Em hãy cộng hàng đơn vị trước (${a % 10} + ${b % 10}), nhớ 1 sang hàng chục nhé! 🐝`,
          explanation: `Ta có ${a} + ${b} = ${sum}. Em tính rất giỏi! 🎉`,
        });
      } else {
        generatedFallback.push({
          id: `cq_fb_v_${i + 1}`,
          question: `Từ nào sau đây viết ĐÚNG CHÍNH TẢ trong bài "${lessonTitle}"?`,
          options: ['Chăm chỉ', 'Trăm chỉ', 'Chăm trỉ', 'Trăm trỉ'],
          correctAnswer: 'Chăm chỉ',
          acceptableAnswers: ['Chăm chỉ', 'chăm chỉ'],
          hint: 'Phân biệt âm ch và tr bé nhé! 🌸',
          explanation: '"Chăm chỉ" là từ viết đúng chính tả tiếng Việt! ⭐',
        });
      }
    }

    return res.json({ questions: generatedFallback, source: 'curriculum_fallback' });
  } catch (error: any) {
    console.error('Error generating curriculum quiz:', error);
    return res.status(500).json({ error: 'Không thể tạo bài tập lúc này' });
  }
});

/**
 * 4. POST /api/ai/analyze-mistakes
 * Teacher dashboard: Analyze common mistakes and give pedagogical insights.
 */
app.post('/api/ai/analyze-mistakes', async (req: Request, res: Response) => {
  try {
    const { mistakesData, classInfo } = req.body;

    if (ai) {
      const prompt = `Bạn là chuyên gia sư phạm tiểu học Việt Nam.
Hãy phân tích dữ liệu lỗi sai của lớp 2A10:
Dữ liệu tóm tắt: ${JSON.stringify(mistakesData || {})}
Lớp: ${classInfo || 'Lớp 2A10'}

Hãy đưa ra phân tích ngắn gọn:
1. Nhận định 2 dạng lỗi học sinh hay nhầm nhất (Toán & Tiếng Việt).
2. Nguyên nhân tâm lý/nhận thức của lứa tuổi 7-8 tuổi.
3. 3 gợi ý thực hành nhanh dành cho giáo viên chủ nhiệm trong tiết sinh hoạt hoặc ôn tập.
Viết súc tích, chuyên môn, mang tính khích lệ học sinh.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      return res.json({ analysis: response.text });
    }

    return res.json({
      analysis: `📊 **Phân tích Sư phạm Lớp 2A10:**
1. **Toán học:** Học sinh thường quên "nhớ 1" khi thực hiện phép cộng qua 10 và nhầm lẫn khi đọc số giờ buổi chiều (sau 12 giờ).
2. **Tiếng Việt:** Còn nhầm lẫn giữa từ chỉ đặc điểm và từ chỉ hoạt động; dễ viết sai phụ âm đầu tr/ch và s/x do phát âm địa phương.
💡 **Khuyến nghị giáo viên:**
- Sử dụng đồ dùng trực quan (que tính, bảng gài) cho bài toán có nhớ.
- Thiết kế trò chơi "Thử tài phân loại từ" bằng thẻ màu sắc để học sinh vận động nhận diện.
- Khen thưởng bằng sao chăm chỉ để tăng động lực cho các bạn còn e dè.`,
    });
  } catch (error: any) {
    console.error('Error analyzing mistakes:', error);
    return res.status(500).json({ error: 'Lỗi phân tích sư phạm' });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI LEARN 2A10 Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
