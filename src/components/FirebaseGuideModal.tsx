import React, { useState } from 'react';
import { ShieldCheck, Database, Key, Server, CheckCircle2, Copy, Check, FileCode, ExternalLink, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const firestoreRulesSample = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 1. Kiểm tra tài khoản là Giáo viên
    function isTeacher() {
      return request.auth != null && 
        get(/databases/$(database)/documents/teachers/$(request.auth.uid)).data != null;
    }
    
    // 2. PHÂN QUYỀN GIÁO VIÊN THEO LỚP:
    // Giáo viên chỉ được xem & sửa dữ liệu của lớp mình phụ trách
    function isClassTeacher(classId) {
      let classDoc = get(/databases/$(database)/documents/classes/$(classId)).data;
      return isTeacher() && (
        classDoc.teacherId == request.auth.uid || 
        request.auth.uid in classDoc.allowedTeacherIds
      );
    }

    // 3. Kiểm tra Học sinh sở hữu tài khoản
    function isStudentOwner(studentId) {
      return request.auth != null && request.auth.uid == studentId;
    }

    // Collection Lớp học: Giáo viên tạo lớp, chỉ GV phụ trách mới sửa được thông tin lớp
    match /classes/{classId} {
      allow read: if request.auth != null;
      allow create: if isTeacher();
      allow update, delete: if isClassTeacher(classId);
    }

    // Sub-collection Học sinh: Chỉ Giáo viên phụ trách lớp đó mới được thêm, sửa, cấp lại PIN, khóa tài khoản
    // Giáo viên lớp khác (ví dụ GV 2A5 xem 2A10) bị chặn hoàn toàn ở tầng cơ sở dữ liệu!
    match /classes/{classId}/students/{studentId} {
      allow read: if isClassTeacher(classId) || isStudentOwner(studentId);
      allow write: if isClassTeacher(classId);
    }

    // Bài làm & Điểm số học tập:
    match /classes/{classId}/submissions/{subId} {
      allow read: if isClassTeacher(classId) || (request.auth != null && resource.data.studentId == request.auth.uid);
      allow create: if request.auth != null && request.resource.data.studentId == request.auth.uid;
      allow update, delete: if isClassTeacher(classId);
    }

    // Ngân hàng câu hỏi & Đề thi:
    match /questions/{questionId} {
      allow read: if resource.data.isApprovedByTeacher == true || isTeacher();
      allow write: if isTeacher();
    }
  }
}`;

  const envSample = `# Biến môi trường kết nối Firebase & Gemini
GEMINI_API_KEY="AIzaSy..."
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="ailearn-smart.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="ailearn-smart"
VITE_FIREBASE_STORAGE_BUCKET="ailearn-smart.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="903777154923"
VITE_FIREBASE_APP_ID="1:903777154923:web:abc123def"`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-pop">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-amber-300 p-6 md:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
            <Database className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">
              Kiến Trúc & Hướng Dẫn Tích Hợp Firebase (Mục VIII & IX)
            </h2>
            <p className="text-sm font-semibold text-amber-700">
              Bảo Mật Dữ Liệu Học Sinh & Phân Quyền Vai Trò (RBAC)
            </p>
          </div>
        </div>

        {/* Notice */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6 text-sm text-blue-900">
          <span className="font-bold flex items-center gap-1.5 text-blue-700 mb-1">
            <CheckCircle2 className="w-4 h-4" /> Phiên bản hiện tại (MVP Preview):
          </span>
          Ứng dụng hiện đang lưu trữ và đồng bộ cục bộ (Local Persistent Store) để thử nghiệm trực quan đầy đủ tính năng: Đăng nhập mã lớp, làm bài, tích điểm, thách đấu và duyệt AI. Khi triển khai trường học chính thức, làm theo 4 bước dưới đây để kết nối Cloud Firestore.
        </div>

        <div className="space-y-6 text-slate-700">
          {/* Step 1 */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
              Tạo dự án Firebase và Bật Firestore Database
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Vào console.firebase.google.com, tạo Project <code className="bg-slate-200 px-1 py-0.5 rounded">ailearn-smart</code>. Bật <strong>Cloud Firestore</strong> ở chế độ Production Mode và bật <strong>Firebase Authentication</strong> (Email/Password hoặc Anonymous kèm Custom Claims cho Học sinh).
            </p>
          </div>

          {/* Step 2 */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                Cấu hình Firestore Security Rules (Chống sửa điểm & Bảo vệ học sinh)
              </h3>
              <button
                onClick={() => copyText(firestoreRulesSample, 'rules')}
                className="text-xs flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-sm"
              >
                {copiedSection === 'rules' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSection === 'rules' ? 'Đã sao chép' : 'Sao chép rules'}
              </button>
            </div>
            <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-xl overflow-x-auto font-mono">
              {firestoreRulesSample}
            </pre>
          </div>

          {/* Step 3 */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                Biến môi trường (.env)
              </h3>
              <button
                onClick={() => copyText(envSample, 'env')}
                className="text-xs flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-sm"
              >
                {copiedSection === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSection === 'env' ? 'Đã sao chép' : 'Sao chép .env'}
              </button>
            </div>
            <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-xl overflow-x-auto font-mono">
              {envSample}
            </pre>
          </div>

          {/* Step 4 */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">4</span>
              Bảo mật API Key & Server Proxy
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mã nguồn ứng dụng đã triển khai sẵn Server Proxy tại <code className="bg-slate-200 px-1 py-0.5 rounded">server.ts</code>. Toàn bộ các yêu cầu AI (gợi ý từng bước, sinh đề bài, giải thích, phân tích lỗi sư phạm) đều chạy ở backend Node.js, không bao giờ lộ <code className="bg-slate-200 px-1 py-0.5 rounded">GEMINI_API_KEY</code> xuống trình duyệt học sinh.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold rounded-2xl shadow-md transition active:scale-95"
          >
            Đã hiểu & Tiếp tục trải nghiệm
          </button>
        </div>
      </div>
    </div>
  );
};
