import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import { soundFx } from '../utils/sound';
import {
  downloadStudentTemplate,
  exportStudentsToExcel,
  exportStudentAccountsToExcel,
  parseStudentExcelFile,
  ParsedStudentRow,
} from '../utils/excel';
import { StudentProfileModal } from './StudentProfileModal';
import {
  Users,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  ArrowUpDown,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  TrendingUp,
  BookOpen,
  Calculator,
  Flame,
  Award,
  X,
  Plus,
  Lock,
  Unlock,
  Key,
  ArrowRightLeft,
  Copy,
  Check,
  UserPlus,
  KeyRound,
} from 'lucide-react';

export const StudentRosterView: React.FC = () => {
  const {
    students,
    allStudents,
    classes,
    currentRole,
    currentTeacher,
    currentClass,
    quickSwitchDemoUser,
    teacherDeleteStudent,
    teacherUpdateStudentInfo,
    teacherImportExcelStudents,
    teacherAddStudent,
    teacherToggleLockStudent,
    teacherTransferStudent,
    teacherResetStudentPin,
  } = useApp();

  // Search, filter, sorting, pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'math' | 'vietnamese' | 'points'>('points');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected student for Profile modal
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);

  // Edit Student Modal state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editGender, setEditGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [editPin, setEditPin] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Delete Confirmation state
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Manual Add Student Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newGender, setNewGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [newBirthday, setNewBirthday] = useState('15/08/2018');
  const [newPin, setNewPin] = useState('1234');
  const [newAvatar, setNewAvatar] = useState('🦊');
  const [newNotes, setNewNotes] = useState('');
  const [addError, setAddError] = useState('');

  // Transfer Student Modal state
  const [transferringStudent, setTransferringStudent] = useState<Student | null>(null);
  const [transferTargetClassId, setTransferTargetClassId] = useState('');
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);

  // Secure PIN Reset Modal state
  const [pinResetStudent, setPinResetStudent] = useState<Student | null>(null);
  const [generatedPin, setGeneratedPin] = useState('');
  const [isCopiedPin, setIsCopiedPin] = useState(false);
  const [pinResetSuccess, setPinResetSuccess] = useState(false);

  // Excel Upload Preview Modal state
  const [isExcelPreviewOpen, setIsExcelPreviewOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [excelErrors, setExcelErrors] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'add_new' | 'update_existing' | 'replace_all'>('add_new');
  const [isImporting, setIsImporting] = useState(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Class Overview Stats (Yêu Cầu 4)
  const stats = useMemo(() => {
    const total = students.length;
    if (total === 0) {
      return {
        total: 0,
        activeThisWeek: 0,
        completedFull: 0,
        needSupport: 0,
        avgMath: 0,
        avgViet: 0,
        topStudents: [],
        improvingStudents: [],
        needHelpStudents: [],
      };
    }

    let activeThisWeek = 0;
    let completedFull = 0;
    let needSupport = 0;
    let sumMathAcc = 0;
    let sumVietAcc = 0;

    students.forEach((s) => {
      const totalLessons = s.mathProgress.completedLessons + s.vietnameseProgress.completedLessons;
      const avgAcc = (s.mathProgress.accuracy + s.vietnameseProgress.accuracy) / 2;

      sumMathAcc += s.mathProgress.accuracy;
      sumVietAcc += s.vietnameseProgress.accuracy;

      if (s.streakDays >= 1 || (s.history && s.history.length > 0)) {
        activeThisWeek++;
      }

      if (totalLessons >= 10 && avgAcc >= 85) {
        completedFull++;
      }

      if (totalLessons < 5 || avgAcc < 75) {
        needSupport++;
      }
    });

    const avgMath = Math.round(sumMathAcc / total);
    const avgViet = Math.round(sumVietAcc / total);

    // Top students
    const sortedByPoints = [...students].sort((a, b) => b.totalPoints - a.totalPoints);
    const topStudents = sortedByPoints.slice(0, 3);

    // Improving students
    const improvingStudents = [...students]
      .filter((s) => s.streakDays >= 4 && (s.mathProgress.accuracy + s.vietnameseProgress.accuracy) / 2 >= 85)
      .slice(0, 3);

    // Students needing support
    const needHelpStudents = [...students]
      .filter((s) => (s.mathProgress.completedLessons + s.vietnameseProgress.completedLessons < 6) || (s.mathProgress.accuracy + s.vietnameseProgress.accuracy) / 2 < 80)
      .slice(0, 3);

    return {
      total,
      activeThisWeek,
      completedFull,
      needSupport,
      avgMath,
      avgViet,
      topStudents,
      improvingStudents,
      needHelpStudents,
    };
  }, [students]);

  // Filter & Sort Logic
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const matchesQuery =
          s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          s.studentCode.toLowerCase().includes(searchQuery.toLowerCase().trim());

        if (!matchesQuery) return false;

        const totalLessons = s.mathProgress.completedLessons + s.vietnameseProgress.completedLessons;
        if (filterLevel === 'high') return totalLessons >= 10;
        if (filterLevel === 'medium') return totalLessons >= 5 && totalLessons < 10;
        if (filterLevel === 'low') return totalLessons < 5;
        return true;
      })
      .sort((a, b) => {
        let valA: any = a.totalPoints;
        let valB: any = b.totalPoints;

        if (sortBy === 'name') {
          valA = a.name.split(' ').slice(-1)[0];
          valB = b.name.split(' ').slice(-1)[0];
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else if (sortBy === 'math') {
          valA = a.mathProgress.accuracy;
          valB = b.mathProgress.accuracy;
        } else if (sortBy === 'vietnamese') {
          valA = a.vietnameseProgress.accuracy;
          valB = b.vietnameseProgress.accuracy;
        } else {
          valA = a.totalPoints;
          valB = b.totalPoints;
        }

        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
  }, [students, searchQuery, filterLevel, sortBy, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Handle Excel File Selected
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundFx.playClick();
    try {
      const existingCodes = new Set(students.map((s) => s.studentCode.toUpperCase()));
      const result = await parseStudentExcelFile(file, existingCodes);

      setParsedRows(result.rows);
      setExcelErrors(result.errorMessages);
      setIsExcelPreviewOpen(true);
    } catch (err: any) {
      alert(err.message || 'Không thể đọc file Excel.');
    } finally {
      e.target.value = ''; // Reset input
    }
  };

  // Confirm Excel Import
  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('Không có dòng hợp lệ nào để nhập.');
      return;
    }

    if (importMode === 'replace_all') {
      const confirmed = window.confirm(
        `CẢNH BÁO: Chế độ "Thay thế toàn bộ" sẽ làm mới danh sách học sinh của ${currentClass?.name || 'lớp'} bằng file Excel này. Thầy cô có chắc chắn không?`
      );
      if (!confirmed) return;
    }

    setIsImporting(true);
    const result = teacherImportExcelStudents(
      validRows.map((r) => ({
        studentCode: r.studentCode,
        name: r.name,
        birthday: r.birthday,
        gender: r.gender,
        notes: r.notes,
      })),
      importMode
    );

    setIsImporting(false);
    setIsExcelPreviewOpen(false);

    let msg = '';
    if (importMode === 'replace_all') {
      msg = `Đã thay thế toàn bộ danh sách lớp với ${result.added} học sinh mới!`;
    } else {
      msg = `Nhập thành công: ${result.added} học sinh mới, cập nhật ${result.updated} học sinh.`;
    }

    setImportNotification(msg);
    setTimeout(() => setImportNotification(null), 5000);
  };

  // Handle Edit Student Open
  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setEditName(s.name);
    setEditBirthday(s.birthday || '15/08/2018');
    setEditGender(s.gender || 'Nam');
    setEditPin(s.pin);
    setEditNotes(s.teacherNotes || '');
    soundFx.playClick();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    teacherUpdateStudentInfo(editingStudent.id, {
      name: editName.trim(),
      birthday: editBirthday.trim(),
      gender: editGender,
      pin: editPin.trim() || '1234',
      teacherNotes: editNotes.trim(),
    });

    setEditingStudent(null);
  };

  // Handle Delete Student
  const handleConfirmDelete = () => {
    if (!deletingStudent) return;
    teacherDeleteStudent(deletingStudent.id);
    setDeletingStudent(null);
  };

  // Open Add Student Modal
  const handleOpenAddStudent = () => {
    const existingNums = students
      .map((s) => {
        const match = s.studentCode.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => n > 0);
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : students.length + 1;
    const defaultCode = `HS${nextNum < 10 ? '0' : ''}${nextNum}`;
    const randomPin = `${Math.floor(1000 + Math.random() * 9000)}`;

    setNewName('');
    setNewCode(defaultCode);
    setNewGender('Nam');
    setNewBirthday('15/08/2018');
    setNewPin(randomPin);
    setNewAvatar('🦊');
    setNewNotes('');
    setAddError('');
    setIsAddModalOpen(true);
    soundFx.playClick();
  };

  const handleSaveAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (!newName.trim()) {
      setAddError('Vui lòng nhập họ và tên học sinh.');
      return;
    }
    const cleanCode = newCode.trim().toUpperCase();
    if (!cleanCode) {
      setAddError('Vui lòng nhập mã học sinh.');
      return;
    }

    // Check duplicate code across all students
    const isDuplicate = allStudents.some((s) => s.studentCode.toUpperCase() === cleanCode);
    if (isDuplicate) {
      setAddError(`Mã học sinh "${cleanCode}" đã tồn tại trên hệ thống. Vui lòng chọn mã khác.`);
      soundFx.playEncourage();
      return;
    }

    const success = teacherAddStudent({
      studentCode: cleanCode,
      name: newName.trim(),
      pin: newPin.trim() || '1234',
      avatar: newAvatar,
      birthday: newBirthday.trim() || '15/08/2018',
      gender: newGender,
    });

    if (success) {
      setIsAddModalOpen(false);
      setImportNotification(`Đã thêm thành công học sinh ${newName} (${cleanCode}) vào lớp!`);
      setTimeout(() => setImportNotification(null), 4000);
    }
  };

  // Open Transfer Modal
  const handleOpenTransfer = (s: Student) => {
    setTransferringStudent(s);
    const otherClasses = classes.filter((c) => c.id !== currentClass?.id);
    setTransferTargetClassId(otherClasses[0]?.id || '');
    setTransferSuccessMsg(null);
    soundFx.playClick();
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringStudent || !transferTargetClassId) return;

    const res = teacherTransferStudent(transferringStudent.id, transferTargetClassId);
    if (res.success) {
      setTransferSuccessMsg(res.message);
      setTimeout(() => {
        setTransferringStudent(null);
        setTransferSuccessMsg(null);
      }, 2000);
    }
  };

  // Open Reset PIN Modal
  const handleOpenResetPin = (s: Student) => {
    setPinResetStudent(s);
    const newRandomPin = `${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedPin(newRandomPin);
    setIsCopiedPin(false);
    setPinResetSuccess(false);
    soundFx.playClick();
  };

  const handleConfirmResetPin = () => {
    if (!pinResetStudent || !generatedPin) return;
    teacherResetStudentPin(pinResetStudent.id, generatedPin);
    setPinResetSuccess(true);
    soundFx.playCorrect();
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6 animate-pop">
      {/* Role notice for students visiting teacher space */}
      {currentRole !== 'teacher' && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">👩‍🏫</span>
            <div>
              <span className="font-black">Ghi chú phân quyền: </span>
              <span>Mục <strong>Danh Sách Học Sinh</strong> dành riêng cho Giáo viên phụ trách {currentClass?.name || 'lớp'}.</span>
            </div>
          </div>
          <button
            onClick={() => quickSwitchDemoUser('teacher')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl shadow-xs transition"
          >
            Chuyển sang vai Giáo viên ({currentTeacher?.name || 'Thầy Cô'}) 👩‍🏫
          </button>
        </div>
      )}

      {/* ================= YÊU CẦU 4: BẢNG THEO DÕI CẢ LỚP ================= */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-black uppercase text-amber-300 mb-1">
              <Users className="w-3.5 h-3.5" />
              Bảng Theo Dõi Học Tập Toàn Bộ {currentClass?.name || 'Lớp Học'}
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Tổng Quan Tình Hình Học Tập {currentClass?.name || 'Lớp Học'}
            </h2>
            <p className="text-xs text-blue-100 font-semibold mt-0.5">
              Dữ liệu học tập thực tế được cập nhật tự động từ các bài luyện tập và thách đấu
            </p>
          </div>

          {/* Action Buttons for Student Management & Excel */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenAddStudent}
              className="px-3.5 py-2 bg-white text-blue-900 hover:bg-blue-50 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
              title="Thêm từng học sinh thủ công với mã PIN và mã học sinh"
            >
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>+ Thêm học sinh thủ công</span>
            </button>

            <button
              onClick={() => {
                downloadStudentTemplate(currentClass?.classCode || 'Lop2');
                soundFx.playClick();
              }}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl border border-white/30 transition flex items-center gap-1.5 shadow-xs"
              title={`Tải file mẫu Excel (.xlsx) chuẩn ${currentClass?.name || 'lớp học'}`}
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Tải file Excel mẫu</span>
            </button>

            {/* Hidden file input for Excel upload */}
            <label className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95">
              <Upload className="w-4 h-4" />
              <span>Nhập danh sách từ Excel</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                exportStudentsToExcel(students, currentClass?.classCode || 'Lop2');
                soundFx.playCorrect();
              }}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
              title="Xuất bảng điểm và danh sách cả lớp sang Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất điểm số (Excel)</span>
            </button>

            <button
              onClick={() => {
                const list = students.map((s, idx) => ({
                  stt: idx + 1,
                  name: s.name,
                  classCode: s.classCode,
                  studentCode: s.studentCode,
                  username: s.username || s.studentCode.toLowerCase(),
                  initialPassword: s.initialPasswordPlain || '(Đã bảo mật mã hóa)',
                  status: s.isLocked ? 'Đang tạm khóa' : (s.hasAccount ? 'Hoạt động' : 'Chưa tạo tài khoản'),
                }));
                exportStudentAccountsToExcel(list, currentClass?.classCode || 'Lop2');
                soundFx.playCorrect();
              }}
              className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
              title="Xuất danh sách tài khoản học sinh kèm thông tin đăng nhập"
            >
              <KeyRound className="w-4 h-4 text-amber-300" />
              <span>Xuất File Tài Khoản</span>
            </button>
          </div>
        </div>

        {/* 6 Key Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
            <div className="text-[11px] font-bold text-blue-100">Tổng số học sinh</div>
            <div className="text-2xl font-black mt-1">{stats.total} em</div>
            <div className="text-[10px] text-amber-300 font-semibold">Sĩ số {currentClass?.name || 'lớp'}</div>
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
            <div className="text-[11px] font-bold text-blue-100">Học tích cực tuần</div>
            <div className="text-2xl font-black mt-1 text-emerald-300">{stats.activeThisWeek} em</div>
            <div className="text-[10px] text-emerald-200 font-semibold">{Math.round((stats.activeThisWeek / Math.max(stats.total, 1)) * 100)}% cả lớp</div>
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
            <div className="text-[11px] font-bold text-blue-100">Đầy đủ bài tập</div>
            <div className="text-2xl font-black mt-1 text-amber-300">{stats.completedFull} em</div>
            <div className="text-[10px] text-amber-200 font-semibold">Đạt chuẩn tốt ⭐</div>
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
            <div className="text-[11px] font-bold text-blue-100">Cần hỗ trợ thêm</div>
            <div className="text-2xl font-black mt-1 text-rose-300">{stats.needSupport} em</div>
            <div className="text-[10px] text-rose-200 font-semibold">Cần ôn thêm bài 💡</div>
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
            <div className="text-[11px] font-bold text-blue-100">ĐTB Môn Toán</div>
            <div className="text-2xl font-black mt-1">{stats.avgMath}%</div>
            <div className="text-[10px] text-blue-200 font-semibold">Cộng trừ, nhân chia</div>
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
            <div className="text-[11px] font-bold text-blue-100">ĐTB Tiếng Việt</div>
            <div className="text-2xl font-black mt-1">{stats.avgViet}%</div>
            <div className="text-[10px] text-blue-200 font-semibold">Từ ngữ, câu & tả</div>
          </div>
        </div>

        {/* Quick Insights Row: Top students, Improving, Need Help */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20 text-xs">
          <div className="bg-white/10 rounded-xl p-2.5">
            <span className="font-bold text-amber-300 flex items-center gap-1 mb-1">
              <span>👑 Học sinh nổi bật:</span>
            </span>
            <div className="font-semibold text-blue-50">
              {stats.topStudents.map((s) => `${s.avatar} ${s.name}`).join(' • ')}
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-2.5">
            <span className="font-bold text-emerald-300 flex items-center gap-1 mb-1">
              <span>🚀 Có tiến bộ rõ rệt:</span>
            </span>
            <div className="font-semibold text-blue-50">
              {stats.improvingStudents.map((s) => `${s.avatar} ${s.name}`).join(' • ')}
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-2.5">
            <span className="font-bold text-rose-300 flex items-center gap-1 mb-1">
              <span>⚠️ Cần cô nhắc nhở thêm:</span>
            </span>
            <div className="font-semibold text-blue-50">
              {stats.needHelpStudents.length > 0
                ? stats.needHelpStudents.map((s) => `${s.avatar} ${s.name}`).join(' • ')
                : 'Cả lớp đều làm bài rất chăm chỉ!'}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Banner after Import */}
      {importNotification && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-xs font-black text-emerald-900 flex items-center justify-between animate-pop">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{importNotification}</span>
          </div>
          <button onClick={() => setImportNotification(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= YÊU CẦU 2: BẢNG DANH SÁCH HỌC SINH ================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-3 border-slate-100 shadow-md">
        {/* Controls: Search, Filter, Sort, Page Size */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
          {/* Search box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo họ tên hoặc mã HS (VD: Minh Anh, HS01)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filter by completion level */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-bold text-slate-500">Lọc:</span>
              <select
                value={filterLevel}
                onChange={(e) => {
                  setFilterLevel(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden"
              >
                <option value="all">Tất cả bài tập</option>
                <option value="high">Làm tốt (≥ 10 bài)</option>
                <option value="medium">Trung bình (5-9 bài)</option>
                <option value="low">Cần nhắc (&lt; 5 bài)</option>
              </select>
            </div>

            {/* Sort by */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-bold text-slate-500">Xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden"
              >
                <option value="points">Điểm thi đua</option>
                <option value="name">Tên học sinh</option>
                <option value="math">Điểm Toán (%)</option>
                <option value="vietnamese">Điểm Tiếng Việt (%)</option>
              </select>

              <button
                onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="font-black text-blue-600 hover:text-blue-800 ml-1"
                title="Đổi chiều sắp xếp"
              >
                {sortDirection === 'asc' ? '↑ Tăng' : '↓ Giảm'}
              </button>
            </div>

            {/* Page Size */}
            <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-500">Hiện:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden"
              >
                <option value={5}>5 em</option>
                <option value={10}>10 em</option>
                <option value={20}>20 em</option>
                <option value={50}>50 em</option>
              </select>
            </div>
          </div>
        </div>

        {/* The Student Table (Yêu Cầu 2) */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 uppercase font-black tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-3 text-center">Trạng thái</th>
                <th className="py-3 px-3 text-center">Tổng bài</th>
                <th className="py-3 px-3 text-center">Điểm Toán</th>
                <th className="py-3 px-3 text-center">Điểm Tiếng Việt</th>
                <th className="py-3 px-3 text-center">Tích cực</th>
                <th className="py-3 px-3 text-center">Điểm thi đua</th>
                <th className="py-3 px-3 text-center">Mức độ tiến bộ</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-bold">
                    Không tìm thấy học sinh nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const totalLessons = s.mathProgress.completedLessons + s.vietnameseProgress.completedLessons;
                  const avgAcc = Math.round((s.mathProgress.accuracy + s.vietnameseProgress.accuracy) / 2);

                  let progressBadge = {
                    label: 'Đạt chuẩn',
                    color: 'bg-blue-50 text-blue-700 border-blue-200',
                  };
                  if (avgAcc >= 90 && totalLessons >= 10) {
                    progressBadge = { label: 'Xuất sắc ⭐', color: 'bg-amber-100 text-amber-900 border-amber-300' };
                  } else if (avgAcc >= 80) {
                    progressBadge = { label: 'Tiến bộ nhanh 🚀', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
                  } else if (avgAcc < 75 || totalLessons < 5) {
                    progressBadge = { label: 'Cần hỗ trợ ⚠️', color: 'bg-rose-100 text-rose-800 border-rose-300' };
                  }

                  return (
                    <tr key={s.id} className={`hover:bg-slate-50/80 font-semibold transition ${s.isLocked ? 'bg-rose-50/40 opacity-80' : ''}`}>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-500">{globalIdx}</td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => {
                            setSelectedStudentForProfile(s);
                            soundFx.playClick();
                          }}
                          className="flex items-center gap-2.5 text-left group"
                          title="Bấm để xem hồ sơ chi tiết"
                        >
                          <span className="text-xl p-1 bg-slate-100 rounded-xl group-hover:scale-110 transition-transform">
                            {s.avatar}
                          </span>
                          <div>
                            <div className="font-black text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                              <span>{s.name}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                {s.studentCode}
                              </span>
                              {s.isLocked && (
                                <span className="text-[10px] bg-rose-100 text-rose-700 font-extrabold px-1.5 py-0.2 rounded-md border border-rose-300">
                                  Khóa
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-normal">
                              {s.gender || 'Nam'} • {s.birthday || '15/08/2018'}
                            </div>
                          </div>
                        </button>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {s.isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                            <Lock className="w-2.5 h-2.5" /> Tạm khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Hoạt động
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center font-black text-slate-700">
                        {totalLessons} bài
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          {s.mathProgress.accuracy}%
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                          {s.vietnameseProgress.accuracy}%
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center font-bold text-orange-600">
                        🔥 {s.streakDays} ngày
                      </td>

                      <td className="py-3.5 px-3 text-center font-black text-slate-900">
                        {s.totalPoints} đ
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${progressBadge.color}`}>
                          {progressBadge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedStudentForProfile(s);
                              soundFx.playClick();
                            }}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition"
                            title="Xem chi tiết hồ sơ học tập"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition"
                            title="Sửa thông tin học sinh"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              teacherToggleLockStudent(s.id);
                              soundFx.playClick();
                            }}
                            className={`p-1.5 rounded-lg border transition ${
                              s.isLocked
                                ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                            }`}
                            title={s.isLocked ? 'Bấm để mở khóa tài khoản học sinh' : 'Bấm để tạm khóa tài khoản học sinh'}
                          >
                            {s.isLocked ? <Lock className="w-3.5 h-3.5 text-rose-700" /> : <Unlock className="w-3.5 h-3.5 text-slate-600" />}
                          </button>

                          <button
                            onClick={() => handleOpenTransfer(s)}
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
                            title="Chuyển học sinh sang lớp khác"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenResetPin(s)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                            title="Cấp lại mã PIN an toàn"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setDeletingStudent(s);
                              soundFx.playEncourage();
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
                            title="Xóa học sinh khỏi lớp"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs mt-3">
          <div className="font-semibold text-slate-500">
            Hiển thị <strong>{filteredStudents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> -{' '}
            <strong>{Math.min(currentPage * pageSize, filteredStudents.length)}</strong> trên tổng số{' '}
            <strong>{filteredStudents.length}</strong> học sinh
          </div>

          <div className="flex items-center gap-1.5 font-bold">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Trước</span>
            </button>

            <span className="px-3 py-1 font-black text-slate-800">
              Trang {currentPage} / {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
            >
              <span>Sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL: XEM TRƯỚC NHẬP EXCEL (YÊU CẦU 1) ================= */}
      {isExcelPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-pop">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-amber-300 p-6 relative">
            <button
              onClick={() => setIsExcelPreviewOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 rounded-2xl text-2xl border border-amber-200">
                📊
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Kiểm Tra & Xem Trước Danh Sách Excel
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Tổng số dòng đọc được: <strong>{parsedRows.length}</strong> học sinh
                </p>
              </div>
            </div>

            {/* Error alerts if any */}
            {excelErrors.length > 0 && (
              <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl mb-5 text-xs text-rose-900">
                <div className="font-black flex items-center gap-1.5 mb-1 text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Phát hiện {excelErrors.length} lỗi trong file:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 font-semibold">
                  {excelErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] font-bold text-rose-700">
                  Các dòng bị lỗi sẽ không được lưu vào hệ thống trừ khi cô sửa lại trong file hoặc hệ thống sẽ tự động gán mã.
                </p>
              </div>
            )}

            {/* Import Mode Selector (Yêu cầu 1) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-5">
              <label className="text-xs font-black text-slate-800 block mb-2">
                Chọn phương thức cập nhật danh sách:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className={`p-3 rounded-xl border-2 flex items-start gap-2 cursor-pointer transition ${
                  importMode === 'add_new' ? 'bg-blue-50 border-blue-600 font-bold' : 'bg-white border-slate-200'
                }`}>
                  <input
                    type="radio"
                    name="importMode"
                    value="add_new"
                    checked={importMode === 'add_new'}
                    onChange={() => setImportMode('add_new')}
                    className="mt-0.5 text-blue-600"
                  />
                  <div className="text-xs">
                    <div className="font-black text-slate-900">1. Thêm học sinh mới</div>
                    <div className="text-[10px] text-slate-500 font-normal">Giữ nguyên danh sách cũ, chỉ thêm các em chưa có trong lớp.</div>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border-2 flex items-start gap-2 cursor-pointer transition ${
                  importMode === 'update_existing' ? 'bg-amber-50 border-amber-600 font-bold' : 'bg-white border-slate-200'
                }`}>
                  <input
                    type="radio"
                    name="importMode"
                    value="update_existing"
                    checked={importMode === 'update_existing'}
                    onChange={() => setImportMode('update_existing')}
                    className="mt-0.5 text-amber-600"
                  />
                  <div className="text-xs">
                    <div className="font-black text-slate-900">2. Cập nhật thông tin</div>
                    <div className="text-[10px] text-slate-500 font-normal">Ghi đè thông tin theo Mã HS và thêm các em mới.</div>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border-2 flex items-start gap-2 cursor-pointer transition ${
                  importMode === 'replace_all' ? 'bg-rose-50 border-rose-600 font-bold' : 'bg-white border-slate-200'
                }`}>
                  <input
                    type="radio"
                    name="importMode"
                    value="replace_all"
                    checked={importMode === 'replace_all'}
                    onChange={() => setImportMode('replace_all')}
                    className="mt-0.5 text-rose-600"
                  />
                  <div className="text-xs">
                    <div className="font-black text-rose-900">3. Thay thế toàn bộ</div>
                    <div className="text-[10px] text-slate-500 font-normal">Xóa danh sách cũ và thiết lập danh sách hoàn toàn mới.</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto max-h-60 rounded-xl border border-slate-200 mb-6">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 font-black text-slate-600 text-[11px]">
                    <th className="p-2.5 text-center">STT</th>
                    <th className="p-2.5">Mã học sinh</th>
                    <th className="p-2.5">Họ và tên</th>
                    <th className="p-2.5">Ngày sinh</th>
                    <th className="p-2.5">Giới tính</th>
                    <th className="p-2.5">Ghi chú</th>
                    <th className="p-2.5 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((r, i) => (
                    <tr key={i} className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/70 font-semibold'}>
                      <td className="p-2.5 text-center font-bold text-slate-500">{r.stt || i + 1}</td>
                      <td className="p-2.5 font-mono font-black text-blue-700">
                        {r.studentCode || <span className="text-amber-600 italic">(Tự sinh mã)</span>}
                      </td>
                      <td className="p-2.5 font-bold text-slate-800">{r.name || <span className="text-rose-600 italic">Thiếu tên</span>}</td>
                      <td className="p-2.5">{r.birthday}</td>
                      <td className="p-2.5">{r.gender}</td>
                      <td className="p-2.5 text-slate-500 truncate max-w-[150px]">{r.notes}</td>
                      <td className="p-2.5 text-center">
                        {r.isValid ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Hợp lệ
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                            Lỗi dòng
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsExcelPreviewOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={isImporting || parsedRows.filter((r) => r.isValid).length === 0}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận lưu vào danh sách ({parsedRows.filter((r) => r.isValid).length} em)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CHỈNH SỬA HỌC SINH ================= */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-pop">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-amber-300 relative">
            <button
              onClick={() => setEditingStudent(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              Chỉnh Sửa Thông Tin Học Sinh
            </h3>
            <p className="text-xs text-slate-500 font-semibold mb-5">
              Mã học sinh: <strong>{editingStudent.studentCode}</strong> (Không đổi mã)
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Họ và tên học sinh:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Ngày sinh:</label>
                  <input
                    type="text"
                    value={editBirthday}
                    onChange={(e) => setEditBirthday(e.target.value)}
                    placeholder="15/08/2018"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block mb-1">Giới tính:</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1">Mã PIN cá nhân (4 số):</label>
                <input
                  type="text"
                  value={editPin}
                  maxLength={4}
                  onChange={(e) => setEditPin(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Ghi chú riêng của cô:</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-normal"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-xs"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: XÁC NHẬN XÓA HỌC SINH ================= */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-pop">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-4 border-rose-300 relative">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-3xl mb-3">
              ⚠️
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Xác Nhận Xóa Học Sinh?
            </h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Thầy cô có chắc chắn muốn xóa học sinh <strong>{deletingStudent.name}</strong> ({deletingStudent.studentCode}) khỏi {currentClass?.name || 'lớp'}?
            </p>

            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: THÊM HỌC SINH THỦ CÔNG ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-pop">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-blue-300 relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🎒</span>
              <h3 className="text-lg font-black text-slate-900">
                Thêm Học Sinh Mới Vào {currentClass?.name || 'Lớp'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-semibold mb-4">
              Tạo tài khoản học sinh lớp 2 với mã định danh duy nhất và mã PIN đăng nhập tiện lợi
            </p>

            {addError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddStudent} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Họ và tên học sinh: <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ví dụ: Hoàng Tuấn Anh"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Mã học sinh: <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="HS11"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase font-black"
                    required
                  />
                  <span className="text-[10px] text-slate-400 font-normal">Mã duy nhất trong hệ thống</span>
                </div>

                <div>
                  <label className="block mb-1">Mã PIN cá nhân (4 số):</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newPin}
                      maxLength={4}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center text-sm font-black text-blue-700"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setNewPin(`${Math.floor(1000 + Math.random() * 9000)}`)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold shrink-0"
                      title="Tạo mã PIN ngẫu nhiên"
                    >
                      🎲 Tạo mới
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Ngày sinh:</label>
                  <input
                    type="text"
                    value={newBirthday}
                    onChange={(e) => setNewBirthday(e.target.value)}
                    placeholder="15/08/2018"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block mb-1">Giới tính:</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1.5">Chọn nhân vật đại diện:</label>
                <div className="flex flex-wrap gap-2">
                  {['🦊', '🦁', '🐰', '🐼', '🐯', '🦄', '🐨', '🐳', '🐶', '🐱'].map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setNewAvatar(emoji)}
                      className={`w-9 h-9 text-xl rounded-xl flex items-center justify-center transition ${
                        newAvatar === emoji
                          ? 'bg-blue-100 border-2 border-blue-600 scale-110 shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1">Ghi chú ban đầu của thầy cô:</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ghi chú về năng lực, sở thích hoặc tính cách..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-normal"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu học sinh</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CHUYỂN LỚP HỌC CHO HỌC SINH ================= */}
      {transferringStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-pop">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-indigo-300 relative">
            <button
              onClick={() => setTransferringStudent(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🔄</span>
              <h3 className="text-lg font-black text-slate-900">
                Chuyển Học Sinh Sang Lớp Khác
              </h3>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Học sinh: <strong>{transferringStudent.name}</strong> ({transferringStudent.studentCode})
              <br />
              Đang ở lớp: <strong>{currentClass?.name || transferringStudent.classCode}</strong>
            </p>

            {transferSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                <div>{transferSuccessMsg}</div>
              </div>
            ) : (
              <form onSubmit={handleConfirmTransfer} className="space-y-4 text-xs font-bold text-slate-700">
                <div>
                  <label className="block mb-1.5">Chọn lớp chuyển đến:</label>
                  <select
                    value={transferTargetClassId}
                    onChange={(e) => setTransferTargetClassId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-900"
                    required
                  >
                    {classes
                      .filter((c) => c.id !== currentClass?.id)
                      .map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} (Mã: {cls.classCode} • {cls.academicYear})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-normal leading-relaxed">
                  💡 <strong>Lưu ý:</strong> Sau khi chuyển, học sinh sẽ thuộc danh sách lớp mới. Toàn bộ điểm số và bài làm đã hoàn thành của em vẫn được bảo lưu đầy đủ.
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setTransferringStudent(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-xs"
                  >
                    Xác nhận chuyển lớp
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: CẤP LẠI MÃ PIN AN TOÀN ================= */}
      {pinResetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-pop">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-4 border-emerald-300 relative">
            <button
              onClick={() => setPinResetStudent(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mb-3">
              🔑
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              Cấp Lại Mã PIN An Toàn
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Học sinh: <strong>{pinResetStudent.name}</strong> ({pinResetStudent.studentCode})
            </p>

            <div className="bg-slate-50 border-2 border-dashed border-emerald-300 rounded-2xl p-4 mb-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Mã PIN mới được tạo ngẫu nhiên
              </div>
              <div className="text-3xl font-mono font-black text-emerald-700 tracking-widest">
                {generatedPin}
              </div>
              <div className="mt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setGeneratedPin(`${Math.floor(1000 + Math.random() * 9000)}`)}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  Đổi mã khác
                </button>
              </div>
            </div>

            {pinResetSuccess ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold">
                  ✅ Đã cập nhật mã PIN mới cho {pinResetStudent.name}!
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Mã học sinh: ${pinResetStudent.studentCode} - Mã PIN: ${generatedPin}`);
                    setIsCopiedPin(true);
                    setTimeout(() => setIsCopiedPin(false), 3000);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                >
                  {isCopiedPin ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopiedPin ? 'Đã sao chép!' : 'Sao chép thông tin gửi PH'}</span>
                </button>
                <button
                  onClick={() => setPinResetStudent(null)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Đóng lại
                </button>
              </div>
            ) : (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setPinResetStudent(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleConfirmResetPin}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs"
                >
                  Xác nhận lưu mã PIN
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: HỒ SƠ CHI TIẾT HỌC SINH (YÊU CẦU 3) ================= */}
      <StudentProfileModal
        student={selectedStudentForProfile}
        isOpen={!!selectedStudentForProfile}
        onClose={() => setSelectedStudentForProfile(null)}
      />
    </div>
  );
};
