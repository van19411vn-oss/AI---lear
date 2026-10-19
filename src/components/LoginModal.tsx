import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { soundFx } from '../utils/sound';
import {
  X,
  Lock,
  User,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Mail,
  School,
  KeyRound,
  ArrowRight,
  UserPlus,
  LogIn,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'student' | 'teacher';
}

export const LoginModal: React.FC<Props> = ({ isOpen, onClose, defaultRole }) => {
  const {
    loginStudent,
    loginTeacher,
    registerTeacher,
    resetTeacherPassword,
    classes,
    teachers,
    allStudents,
    quickSwitchDemoUser,
  } = useApp();

  const [role, setRole] = useState<'student' | 'teacher'>(defaultRole || 'student');
  const [teacherMode, setTeacherMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Sync role when defaultRole changes or modal opens
  React.useEffect(() => {
    if (defaultRole) {
      setRole(defaultRole);
    }
  }, [defaultRole, isOpen]);

  // Student inputs
  const [classCode, setClassCode] = useState(classes[0]?.classCode || '2A10');
  const [studentIdentifier, setStudentIdentifier] = useState('HS01');
  const [studentPassword, setStudentPassword] = useState('1234');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [showStudentGuide, setShowStudentGuide] = useState(false);

  // Teacher Login inputs
  const [teacherEmail, setTeacherEmail] = useState('lan.hoang@ailearn.edu.vn');
  const [teacherPass, setTeacherPass] = useState('123');

  // Teacher Register inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regSchool, setRegSchool] = useState('');
  const [regClassName, setRegClassName] = useState('Lớp 2A5');
  const [regClassCode, setRegClassCode] = useState('2A5');

  // Teacher Forgot password inputs
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Student login
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const res = loginStudent(classCode, studentIdentifier, studentPassword);
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setErrorMsg(res.message);
      soundFx.playEncourage();
    }
  };

  // Teacher login
  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const res = loginTeacher(teacherEmail, teacherPass);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message);
      soundFx.playEncourage();
    }
  };

  // Teacher register
  const handleTeacherRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName.trim() || !regEmail.trim() || !regPass.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ các thông tin bắt buộc!');
      return;
    }

    const res = registerTeacher({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPass.trim(),
      schoolName: regSchool.trim() || 'Trường Tiểu học',
      initialClassName: regClassName.trim() || `Lớp ${regClassCode.trim().toUpperCase()}`,
      initialClassCode: regClassCode.trim().toUpperCase() || '2A5',
    });

    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.message);
      soundFx.playEncourage();
    }
  };

  // Teacher forgot password
  const handleTeacherForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!forgotEmail.trim() || !forgotNewPass.trim()) {
      setErrorMsg('Vui lòng nhập email và mật khẩu mới!');
      return;
    }

    const res = resetTeacherPassword(forgotEmail, forgotNewPass);
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        setTeacherEmail(forgotEmail.trim());
        setTeacherPass(forgotNewPass.trim());
        setTeacherMode('login');
        setSuccessMsg('');
      }, 1500);
    } else {
      setErrorMsg(res.message);
      soundFx.playEncourage();
    }
  };

  // Filter students for selected class preview
  const classStudents = allStudents.filter(
    (s) => s.classCode.toUpperCase() === classCode.trim().toUpperCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-pop">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl border-4 border-amber-300 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-sky-400 flex items-center justify-center text-3xl shadow-sm mb-2">
            🐝
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            AI LEARN
          </h2>
          <div className="inline-block px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black uppercase tracking-wider mt-0.5">
            Trạm Học Tập Thông Minh
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Mỗi em một lộ trình – Mỗi ngày một tiến bộ
          </p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setRole('student');
              setErrorMsg('');
              setSuccessMsg('');
              soundFx.playClick();
            }}
            className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
              role === 'student'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Học sinh 🎒</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('teacher');
              setErrorMsg('');
              setSuccessMsg('');
              soundFx.playClick();
            }}
            className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
              role === 'teacher'
                ? 'bg-white text-amber-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Giáo viên 👩‍🏫</span>
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl text-center animate-shake">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================= 1. STUDENT LOGIN ================= */}
        {role === 'student' && (
          <form onSubmit={handleStudentSubmit} className="space-y-3.5">
            {/* Field 1: Mã Lớp */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black text-slate-700">1. Mã lớp:</label>
                <span className="text-[10px] text-slate-400 font-bold">Chọn lớp có sẵn hoặc gõ</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  placeholder="2A10, 2A1, 2A2..."
                  className="flex-1 p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-black text-sm uppercase text-slate-900 focus:outline-hidden focus:border-blue-500"
                  required
                />
                <select
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  className="p-2.5 bg-blue-50 border-2 border-blue-200 text-blue-900 font-bold text-xs rounded-xl focus:outline-hidden"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.classCode}>
                      {c.name} ({c.classCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Field 2: Tên Đăng Nhập hoặc Mã Học Sinh */}
            <div>
              <label className="text-xs font-black text-slate-700 block mb-1">
                2. Tên đăng nhập hoặc Mã học sinh:
              </label>
              <input
                type="text"
                value={studentIdentifier}
                onChange={(e) => setStudentIdentifier(e.target.value)}
                placeholder="VD: 2a10_minhanh hoặc HS01"
                className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-black text-sm text-slate-900 focus:outline-hidden focus:border-blue-500"
                required
              />
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
                Không cần email cá nhân. Nhập theo phiếu cô giáo cấp.
              </span>
            </div>

            {/* Field 3: Mật Khẩu (kèm Hiện/Ẩn mật khẩu) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black text-slate-700">3. Mật khẩu:</label>
                <button
                  type="button"
                  onClick={() => setShowStudentPassword(!showStudentPassword)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {showStudentPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Ẩn mật khẩu</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Hiện mật khẩu</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showStudentPassword ? 'text' : 'password'}
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu (VD: 1234)"
                  className="w-full p-2.5 pr-10 bg-slate-50 border-2 border-slate-200 rounded-xl font-black text-sm text-slate-900 focus:outline-hidden focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowStudentPassword(!showStudentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex={-1}
                >
                  {showStudentPassword ? (
                    <EyeOff className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit & Guidance Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl shadow-md shadow-blue-200 transition active:scale-98 flex items-center justify-center gap-2 text-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập Vào Học Ngay</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowStudentGuide(!showStudentGuide);
                  soundFx.playClick();
                }}
                className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-200 transition flex items-center justify-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>{showStudentGuide ? 'Ẩn Hướng Dẫn' : 'Hướng Dẫn Đăng Nhập Cho Học Sinh Lớp 2 💡'}</span>
              </button>
            </div>

            {/* Visual Guide Box for Grade 2 Students & Parents */}
            {showStudentGuide && (
              <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs text-amber-950 space-y-2 animate-pop">
                <div className="font-black flex items-center gap-1 text-slate-900">
                  <span>📖</span>
                  <span>Các Bước Đăng Nhập Cực Dễ Cho Con:</span>
                </div>
                <div className="space-y-1 font-semibold text-[11px] text-amber-900">
                  <div>
                    <strong>Bước 1:</strong> Xem phiếu dán ở vở để biết <strong>Mã lớp</strong> (VD: 2A10).
                  </div>
                  <div>
                    <strong>Bước 2:</strong> Gõ <strong>Tên đăng nhập</strong> (VD: 2a10_minhanh) hoặc <strong>Mã HS</strong> (VD: HS01).
                  </div>
                  <div>
                    <strong>Bước 3:</strong> Nhập <strong>Mật khẩu</strong> do cô cấp (VD: 1234). Con có thể bấm nút &quot;Hiện mật khẩu&quot; để nhìn rõ số.
                  </div>
                  <div>
                    <strong>Bước 4:</strong> Bấm nút xanh <strong>&quot;Đăng Nhập Vào Học Ngay&quot;</strong> để cùng bạn Ong Vàng học bài!
                  </div>
                  <div className="pt-1 border-t border-amber-200 text-slate-600">
                    💡 <em>Nếu con quên mật khẩu, hãy nhờ bố mẹ nhắn cô giáo chủ nhiệm để cô cấp lại trong 3 giây nhé!</em>
                  </div>
                </div>
              </div>
            )}

            {/* Quick 1-click test student buttons for active class */}
            <div className="pt-2 text-center border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                Thử nhanh với học sinh lớp ({classCode}):
              </span>
              <div className="flex flex-wrap justify-center gap-1.5 max-h-24 overflow-y-auto p-1">
                {classStudents.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setClassCode(s.classCode);
                      setStudentIdentifier(s.username || s.studentCode);
                      setStudentPassword(s.initialPasswordPlain || s.pin || '1234');
                      quickSwitchDemoUser('student', s.id);
                      setSuccessMsg(`Xin chào, ${s.name}!`);
                      setTimeout(() => onClose(), 800);
                    }}
                    className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 rounded-lg border border-slate-200 transition"
                  >
                    {s.avatar} {s.name.split(' ').slice(-1)[0]} ({s.studentCode})
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* ================= 2. TEACHER AUTH (LOGIN / REGISTER / FORGOT) ================= */}
        {role === 'teacher' && (
          <div>
            {/* Mode 2.1: Teacher Login */}
            {teacherMode === 'login' && (
              <form onSubmit={handleTeacherSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    Email giáo viên:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      placeholder="lan.hoang@ailearn.edu.vn"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-slate-700">Mật khẩu:</label>
                    <button
                      type="button"
                      onClick={() => {
                        setTeacherMode('forgot');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-[11px] font-bold text-amber-700 hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      value={teacherPass}
                      onChange={(e) => setTeacherPass(e.target.value)}
                      placeholder="Nhập mật khẩu (thử: 123)"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-900 font-black rounded-2xl shadow-md shadow-amber-200 transition active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập Góc Giáo Viên</span>
                </button>

                {/* Switch to Register */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTeacherMode('register');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-xs font-extrabold text-blue-600 hover:text-blue-800 transition"
                  >
                    Chưa có tài khoản? <strong>Đăng ký giáo viên mới →</strong>
                  </button>
                </div>

                {/* 1-Click sample accounts for multi-teacher demonstration */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-2 text-center">
                    Tài khoản giáo viên mẫu có sẵn:
                  </span>
                  <div className="space-y-1.5">
                    {teachers.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          quickSwitchDemoUser('teacher', t.id);
                          onClose();
                        }}
                        className="w-full p-2 rounded-xl text-left border border-slate-200 hover:border-amber-400 hover:bg-amber-50/60 transition flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{t.avatar}</span>
                          <div>
                            <div className="font-black text-slate-800">{t.name}</div>
                            <div className="text-[10px] text-slate-500">{t.schoolName}</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold">
                          Lớp {classes.find((c) => c.id === t.activeClassId)?.classCode || t.classCode}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}

            {/* Mode 2.2: Teacher Register */}
            {teacherMode === 'register' && (
              <form onSubmit={handleTeacherRegister} className="space-y-3">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    Họ và tên giáo viên <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ví dụ: Cô Lê Thị Mai"
                    className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-amber-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1">
                      Email <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="mai.le@ailearn.edu.vn"
                      className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs text-slate-900 focus:outline-hidden focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1">
                      Mật khẩu <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="password"
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      placeholder="Ít nhất 6 ký tự"
                      className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs text-slate-900 focus:outline-hidden focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    Trường tiểu học:
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={regSchool}
                      onChange={(e) => setRegSchool(e.target.value)}
                      placeholder="Ví dụ: Tiểu học Ba Đình"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1">
                      Tên lớp ban đầu:
                    </label>
                    <input
                      type="text"
                      value={regClassName}
                      onChange={(e) => setRegClassName(e.target.value)}
                      placeholder="Lớp 2A5"
                      className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs text-slate-900 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1">
                      Mã lớp:
                    </label>
                    <input
                      type="text"
                      value={regClassCode}
                      onChange={(e) => setRegClassCode(e.target.value.toUpperCase())}
                      placeholder="2A5"
                      className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-black text-xs uppercase text-slate-900 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Đăng Ký Tài Khoản Giáo Viên 🚀</span>
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTeacherMode('login');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    Đã có tài khoản? <strong>Đăng nhập ngay</strong>
                  </button>
                </div>
              </form>
            )}

            {/* Mode 2.3: Teacher Forgot Password */}
            {teacherMode === 'forgot' && (
              <form onSubmit={handleTeacherForgot} className="space-y-3.5">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    Nhập email tài khoản giáo viên:
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="lan.hoang@ailearn.edu.vn"
                    className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    Mật khẩu mới muốn đặt lại:
                  </label>
                  <input
                    type="password"
                    value={forgotNewPass}
                    onChange={(e) => setForgotNewPass(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-amber-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-900 font-black rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Khôi Phục Mật Khẩu 🔑</span>
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTeacherMode('login');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    ← Quay lại đăng nhập
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Security footnote */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Hệ thống phân quyền an toàn theo tài khoản giáo viên</span>
        </div>
      </div>
    </div>
  );
};
