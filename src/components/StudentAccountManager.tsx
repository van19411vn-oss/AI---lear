import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Student, BatchAccountResult, BatchAccountItem } from '../types';
import { soundFx } from '../utils/sound';
import {
  exportStudentAccountsToExcel,
  downloadStudentTemplate,
  parseStudentExcelFile,
  ParsedStudentRow,
} from '../utils/excel';
import { generateStudentUsername, generateRandomStudentPassword } from '../utils/security';
import {
  Users,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Upload,
  Printer,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  X,
  FileSpreadsheet,
  UserCheck,
  UserX,
  HelpCircle,
  Eye,
  EyeOff,
  School,
  ChevronRight,
  Info,
} from 'lucide-react';

interface Props {
  onOpenProfile?: (student: Student) => void;
}

export const StudentAccountManager: React.FC<Props> = ({ onOpenProfile }) => {
  const {
    students,
    allStudents,
    currentClass,
    classes,
    currentTeacher,
    switchActiveClass,
    batchCreateStudentAccounts,
    teacherResetStudentPassword,
    teacherCreateStudentAccount,
    teacherToggleLockStudent,
    teacherImportExcelStudents,
  } = useApp();

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unregistered' | 'locked'>('all');

  // Copy indicator state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Single Student Password Reset Modal State
  const [resetModalStudent, setResetModalStudent] = useState<Student | null>(null);
  const [customPasswordInput, setCustomPasswordInput] = useState('');
  const [resetResultPassword, setResetResultPassword] = useState<string | null>(null);
  const [isCopiedResetPass, setIsCopiedResetPass] = useState(false);

  // 2. Single Student Create Account Modal State
  const [createModalStudent, setCreateModalStudent] = useState<Student | null>(null);
  const [customUsernameInput, setCustomUsernameInput] = useState('');
  const [customNewPassInput, setCustomNewPassInput] = useState('');
  const [createResult, setCreateResult] = useState<{ username: string; pass: string } | null>(null);

  // 3. Batch 6-Step Wizard Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [selectedClassId, setSelectedClassId] = useState<string>(currentClass?.id || classes[0]?.id || '');
  const [dataSourceType, setDataSourceType] = useState<'existing' | 'excel'>('existing');
  const [skipAlreadyHasAccount, setSkipAlreadyHasAccount] = useState(true);

  // Excel upload within wizard state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelParsedRows, setExcelParsedRows] = useState<ParsedStudentRow[]>([]);
  const [excelErrors, setExcelErrors] = useState<string[]>([]);
  const [isParsingExcel, setIsParsingExcel] = useState(false);

  // Batch Result State
  const [batchResult, setBatchResult] = useState<BatchAccountResult | null>(null);

  // 4. Print Credential Cards Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Classes this teacher is authorized to manage
  const authorizedClasses = classes.filter(
    (c) => currentTeacher?.managedClassIds?.includes(c.id) || c.teacherId === currentTeacher?.id
  );

  // Selected target class object
  const activeTargetClass = classes.find((c) => c.id === selectedClassId) || currentClass || classes[0];

  // Students belonging to current active class
  const classStudents = useMemo(() => {
    if (!currentClass) return students;
    return allStudents.filter(
      (s) => s.classCode.toUpperCase() === currentClass.classCode.toUpperCase()
    );
  }, [allStudents, currentClass, students]);

  // Statistics for current class accounts
  const stats = useMemo(() => {
    const total = classStudents.length;
    const activeAccounts = classStudents.filter((s) => s.hasAccount && !s.isLocked && s.accountStatus !== 'locked').length;
    const unregistered = classStudents.filter((s) => !s.hasAccount || s.accountStatus === 'unregistered').length;
    const locked = classStudents.filter((s) => s.isLocked || s.accountStatus === 'locked').length;

    return { total, activeAccounts, unregistered, locked };
  }, [classStudents]);

  // Filtered students in main table
  const filteredStudents = useMemo(() => {
    return classStudents.filter((s) => {
      // Search by name, studentCode, or username
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q) ||
        (s.username && s.username.toLowerCase().includes(q));

      // Filter by status
      if (!matchSearch) return false;
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') return s.hasAccount && !s.isLocked && s.accountStatus !== 'locked';
      if (statusFilter === 'unregistered') return !s.hasAccount || s.accountStatus === 'unregistered';
      if (statusFilter === 'locked') return s.isLocked || s.accountStatus === 'locked';

      return true;
    });
  }, [classStudents, searchQuery, statusFilter]);

  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    soundFx.playClick();
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Trigger individual password reset
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalStudent) return;

    const res = teacherResetStudentPassword(resetModalStudent.id, customPasswordInput || undefined);
    if (res.success) {
      setResetResultPassword(res.newPassword);
      soundFx.playCorrect();
    }
  };

  // Trigger individual account creation
  const handleCreateAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createModalStudent) return;

    const res = teacherCreateStudentAccount(
      createModalStudent.id,
      customUsernameInput || undefined,
      customNewPassInput || undefined
    );
    if (res.success) {
      setCreateResult({ username: res.username, pass: res.initialPassword });
      soundFx.playCorrect();
    }
  };

  // Open Wizard
  const handleOpenWizard = () => {
    setSelectedClassId(currentClass?.id || classes[0]?.id || '');
    setWizardStep(1);
    setDataSourceType('existing');
    setExcelFile(null);
    setExcelParsedRows([]);
    setExcelErrors([]);
    setBatchResult(null);
    setIsWizardOpen(true);
    soundFx.playClick();
  };

  // Handle Excel upload in wizard Step 3
  const handleExcelUpload = async (file: File) => {
    setIsParsingExcel(true);
    setExcelFile(file);
    try {
      const existingCodes = new Set(allStudents.map((s) => s.studentCode.toUpperCase()));
      const res = await parseStudentExcelFile(file, existingCodes);
      setExcelParsedRows(res.rows);
      setExcelErrors(res.errorMessages);
      soundFx.playCorrect();
    } catch (err: any) {
      setExcelErrors([err.message || 'Lỗi khi đọc file Excel']);
      soundFx.playEncourage();
    } finally {
      setIsParsingExcel(false);
    }
  };

  // Wizard Step 4: Preview items calculation
  const wizardPreviewItems = useMemo(() => {
    if (dataSourceType === 'excel') {
      const targetCode = activeTargetClass.classCode;
      const existingUsernames = new Set(allStudents.map((s) => s.username?.toLowerCase()).filter(Boolean) as string[]);

      return excelParsedRows.map((r, idx) => {
        const studentCode = r.studentCode || `${targetCode}-${idx + 1 < 10 ? '0' : ''}${idx + 1}`;
        const username = generateStudentUsername(r.name, targetCode, existingUsernames);
        existingUsernames.add(username.toLowerCase());

        return {
          stt: idx + 1,
          name: r.name,
          studentCode,
          username,
          hasAccount: false,
          isValid: r.isValid,
          validationError: r.validationError,
        };
      });
    }

    // Existing class students
    const targetCode = activeTargetClass.classCode;
    const targetStudents = allStudents.filter(
      (s) => s.classCode.toUpperCase() === targetCode.toUpperCase()
    );

    const existingUsernames = new Set(allStudents.map((s) => s.username?.toLowerCase()).filter(Boolean) as string[]);

    return targetStudents.map((s, idx) => {
      const username = s.username || generateStudentUsername(s.name, targetCode, existingUsernames);
      existingUsernames.add(username.toLowerCase());
      return {
        stt: idx + 1,
        studentId: s.id,
        name: s.name,
        studentCode: s.studentCode,
        username,
        hasAccount: Boolean(s.hasAccount && s.username),
        isLocked: s.isLocked,
        isValid: true,
      };
    });
  }, [dataSourceType, excelParsedRows, activeTargetClass, allStudents]);

  // Wizard Step 5 -> 6: Confirm and Execute batch account creation
  const handleExecuteBatchCreation = () => {
    // If Excel mode: first import students into active target class
    if (dataSourceType === 'excel') {
      if (excelParsedRows.length === 0) return;
      const validRows = excelParsedRows.filter((r) => r.isValid);
      teacherImportExcelStudents(validRows, 'add_new');
    }

    // Provision accounts
    const result = batchCreateStudentAccounts(activeTargetClass.id, {
      forceReset: !skipAlreadyHasAccount,
    });

    setBatchResult(result);
    setWizardStep(6);
    soundFx.playFanfare();
  };

  // Export created accounts to Excel
  const handleExportAccounts = () => {
    const listToExport = batchResult
      ? batchResult.items.map((item) => ({
          stt: item.stt,
          name: item.name,
          classCode: item.classCode || activeTargetClass.classCode,
          studentCode: item.studentCode,
          username: item.username,
          initialPassword: item.initialPassword || '(Bảo mật)',
          status: item.status === 'created' ? 'Đã tạo thành công' : 'Đã có tài khoản trước đó',
        }))
      : classStudents.map((s, idx) => ({
          stt: idx + 1,
          name: s.name,
          classCode: s.classCode,
          studentCode: s.studentCode,
          username: s.username || s.studentCode.toLowerCase(),
          initialPassword: s.initialPasswordPlain || '(Đã bảo mật mã hóa)',
          status: s.isLocked ? 'Đang tạm khóa' : (s.hasAccount ? 'Hoạt động' : 'Chưa tạo tài khoản'),
        }));

    exportStudentAccountsToExcel(listToExport, currentClass?.classCode || 'Lop2');
    soundFx.playClick();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Class Selector */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-blue-100 border-2 border-indigo-400/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase mb-2">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Phân Hệ Quản Lý Tài Khoản Học Sinh</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              Tài Khoản & Mật Khẩu Lớp {currentClass?.name || 'Khối 2'} 🎒
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-1">
              Tạo tên đăng nhập tự động duy nhất, sinh mật khẩu ngẫu nhiên an toàn, cấp lại mật khẩu và bảo vệ dữ liệu học tập.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenWizard}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-slate-900" />
              <span>Tạo Tài Khoản Cả Lớp (6 Bước)</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-2xl border border-white/20 transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>In Thẻ Tài Khoản</span>
            </button>

            <button
              onClick={handleExportAccounts}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3.5 rounded-2xl">
            <div className="text-slate-300 text-[11px] font-bold">Tổng số học sinh</div>
            <div className="text-2xl font-black text-white mt-0.5">{stats.total} em</div>
            <div className="text-[10px] text-slate-400 font-semibold mt-1">Lớp {currentClass?.name}</div>
          </div>

          <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 p-3.5 rounded-2xl">
            <div className="text-emerald-200 text-[11px] font-bold flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đã cấp tài khoản</span>
            </div>
            <div className="text-2xl font-black text-emerald-300 mt-0.5">{stats.activeAccounts} em</div>
            <div className="text-[10px] text-emerald-200/80 font-semibold mt-1">Sẵn sàng đăng nhập</div>
          </div>

          <div className="bg-amber-500/20 backdrop-blur-md border border-amber-400/30 p-3.5 rounded-2xl">
            <div className="text-amber-200 text-[11px] font-bold flex items-center gap-1">
              <UserX className="w-3.5 h-3.5 text-amber-400" />
              <span>Chưa có tài khoản</span>
            </div>
            <div className="text-2xl font-black text-amber-300 mt-0.5">{stats.unregistered} em</div>
            <div className="text-[10px] text-amber-200/80 font-semibold mt-1">Cần tạo tài khoản</div>
          </div>

          <div className="bg-rose-500/20 backdrop-blur-md border border-rose-400/30 p-3.5 rounded-2xl">
            <div className="text-rose-200 text-[11px] font-bold flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Đang tạm khóa</span>
            </div>
            <div className="text-2xl font-black text-rose-300 mt-0.5">{stats.locked} em</div>
            <div className="text-[10px] text-rose-200/80 font-semibold mt-1">Không thể đăng nhập</div>
          </div>
        </div>
      </div>

      {/* 2. Security Notice for Teachers */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 font-semibold shadow-xs">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-black text-slate-900 block mb-0.5">
            Quy Định Bảo Vệ Dữ Liệu & Phân Quyền Giảng Dạy:
          </strong>
          <span>
            Thầy cô chỉ được tạo và quản lý tài khoản học sinh thuộc lớp mình hoặc lớp được phân quyền. Mật khẩu học sinh được mã hóa an toàn (SHA-256) và không hiển thị dưới dạng văn bản thuần sau khi hoàn tất cấp tài khoản. Hãy tải file Excel hoặc in thẻ tài khoản để phát riêng cho từng phụ huynh.
          </span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo họ tên, mã HS, username..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Lọc:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
          >
            <option value="all">Tất cả ({classStudents.length})</option>
            <option value="active">Đã cấp tài khoản ({stats.activeAccounts})</option>
            <option value="unregistered">Chưa tạo tài khoản ({stats.unregistered})</option>
            <option value="locked">Tạm khóa ({stats.locked})</option>
          </select>

          <button
            onClick={() => downloadStudentTemplate(currentClass?.classCode || 'Lop2')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl border border-blue-200 transition flex items-center gap-1.5 whitespace-nowrap"
            title="Tải file mẫu Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">File Mẫu Excel</span>
          </button>
        </div>
      </div>

      {/* 4. Student Accounts Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">STT</th>
                <th className="py-3.5 px-4">Học Sinh</th>
                <th className="py-3.5 px-4">Mã Học Sinh</th>
                <th className="py-3.5 px-4">Tên Đăng Nhập</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-center">Mật Khẩu / PIN</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold">Không tìm thấy học sinh nào phù hợp bộ lọc</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const hasAccount = Boolean(s.hasAccount && s.username);
                  const isLocked = Boolean(s.isLocked || s.accountStatus === 'locked');

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isLocked ? 'bg-rose-50/30' : !hasAccount ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-bold">
                        {idx + 1}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl p-1 bg-slate-100 rounded-xl">{s.avatar}</span>
                          <div>
                            <div className="font-black text-slate-900 flex items-center gap-1.5">
                              <span>{s.name}</span>
                              {s.gender === 'Nữ' ? (
                                <span className="text-[10px] text-pink-500 font-bold">♀</span>
                              ) : (
                                <span className="text-[10px] text-blue-500 font-bold">♂</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Lớp: {s.classCode} • NS: {s.birthday || 'Chưa có'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                          {s.studentCode}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {hasAccount ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
                              {s.username}
                            </span>
                            <button
                              onClick={() => handleCopyText(s.username || '', `u-${s.id}`)}
                              className="text-slate-400 hover:text-slate-600 p-1"
                              title="Sao chép tên đăng nhập"
                            >
                              {copiedId === `u-${s.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic font-semibold">
                            Chưa tạo username
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                            <Lock className="w-3 h-3 text-rose-600" />
                            <span>Tạm khóa</span>
                          </span>
                        ) : hasAccount ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Đã cấp tài khoản</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Chưa tạo</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>••••</span>
                          <span className="text-[10px] text-slate-400">(Bảo mật)</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {hasAccount ? (
                            <>
                              <button
                                onClick={() => {
                                  setResetModalStudent(s);
                                  setCustomPasswordInput('');
                                  setResetResultPassword(null);
                                  setIsCopiedResetPass(false);
                                  soundFx.playClick();
                                }}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold text-xs border border-amber-200 transition flex items-center gap-1"
                                title="Cấp lại mật khẩu mới khi học sinh quên"
                              >
                                <KeyRound className="w-3 h-3 text-amber-600" />
                                <span>Cấp lại MK</span>
                              </button>

                              <button
                                onClick={() => {
                                  teacherToggleLockStudent(s.id);
                                }}
                                className={`p-1.5 rounded-lg border transition ${
                                  isLocked
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                }`}
                                title={isLocked ? 'Mở khóa tài khoản' : 'Tạm khóa tài khoản'}
                              >
                                {isLocked ? (
                                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                                )}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setCreateModalStudent(s);
                                setCustomUsernameInput(generateStudentUsername(s.name, s.classCode, new Set()));
                                setCustomNewPassInput(generateRandomStudentPassword(4));
                                setCreateResult(null);
                                soundFx.playClick();
                              }}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-xs shadow-xs transition flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              <span>Cấp tài khoản</span>
                            </button>
                          )}

                          {onOpenProfile && (
                            <button
                              onClick={() => onOpenProfile(s)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
                              title="Xem hồ sơ học tập"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL: QUY TRÌNH TẠO TÀI KHOẢN HÀNG LOẠT 6 BƯỚC (YÊU CẦU PHẦN 3)      */}
      {/* ========================================================================= */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-pop">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl border-4 border-amber-300 relative flex flex-col justify-between">
            <button
              onClick={() => setIsWizardOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Stepper Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl select-none">⚡</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    Quy Trình Tạo Tài Khoản Hàng Loạt Cho Cả Lớp
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Thực hiện theo 6 bước an toàn và chuẩn bảo mật
                  </p>
                </div>
              </div>

              {/* Step indicator pills */}
              <div className="flex items-center gap-1 sm:gap-2 my-4 overflow-x-auto pb-2 no-scrollbar">
                {[1, 2, 3, 4, 5, 6].map((st) => (
                  <div
                    key={st}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black whitespace-nowrap transition ${
                      wizardStep === st
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : wizardStep > st
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <span>B{st}:</span>
                    <span>
                      {st === 1 && 'Chọn lớp'}
                      {st === 2 && 'Bắt đầu'}
                      {st === 3 && 'Nguồn dữ liệu'}
                      {st === 4 && 'Xem trước'}
                      {st === 5 && 'Xác nhận'}
                      {st === 6 && 'Kết quả & Xuất'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Wizard Body Content */}
            <div className="py-2 flex-1">
              {/* BƯỚC 1: Chọn lớp đang quản lý */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                    <h4 className="font-black text-sm text-blue-900 mb-1">
                      Bước 1: Chọn lớp học thầy cô đang phụ trách
                    </h4>
                    <p className="text-xs text-blue-700 font-semibold">
                      Chỉ hiển thị các lớp mà thầy cô được cấp quyền quản lý theo quy định bảo mật.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {authorizedClasses.map((cls) => (
                      <div
                        key={cls.id}
                        onClick={() => {
                          setSelectedClassId(cls.id);
                          switchActiveClass(cls.id);
                          soundFx.playClick();
                        }}
                        className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                          selectedClassId === cls.id
                            ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">🏫</span>
                          <div>
                            <div className="font-black text-slate-900 text-sm">{cls.name}</div>
                            <div className="text-xs text-slate-500 font-semibold">
                              Mã lớp: {cls.classCode} • Niên khóa: {cls.academicYear} •{' '}
                              {allStudents.filter((s) => s.classCode === cls.classCode).length} học sinh
                            </div>
                          </div>
                        </div>

                        {selectedClassId === cls.id && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BƯỚC 2: Chọn "Tạo tài khoản học sinh" */}
              {wizardStep === 2 && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-4xl shadow-inner">
                    🐝
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">
                      Bước 2: Chuẩn Bị Tạo Tài Khoản Lớp {activeTargetClass.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto mt-1">
                      Hệ thống sẽ cấp tài khoản đồng loạt cho toàn bộ học sinh lớp{' '}
                      <strong>{activeTargetClass.classCode}</strong> với tên đăng nhập duy nhất toàn hệ thống và mật khẩu ngẫu nhiên an toàn.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs text-slate-700 space-y-2 max-w-md mx-auto">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Các nguyên tắc bảo mật được áp dụng:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>Tên đăng nhập tự động duy nhất toàn hệ thống (không trùng lặp).</li>
                      <li>Mật khẩu ban đầu ngẫu nhiên, không dùng thông tin cá nhân dễ đoán.</li>
                      <li>Mật khẩu được băm (hash) ngay lập tức, không lưu văn bản thuần.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* BƯỚC 3: Chọn nguồn danh sách (Có sẵn hoặc Excel) */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 font-semibold">
                    <strong className="block font-black text-sm mb-0.5">
                      Bước 3: Chọn phương thức lấy danh sách học sinh
                    </strong>
                    Thầy cô có thể sử dụng danh sách học sinh đã có sẵn trong lớp hoặc tải lên file Excel mới.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option A: Existing students */}
                    <div
                      onClick={() => {
                        setDataSourceType('existing');
                        soundFx.playClick();
                      }}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                        dataSourceType === 'existing'
                          ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl mb-3">
                          📋
                        </div>
                        <h5 className="font-black text-slate-900 text-sm mb-1">
                          Cách 1: Sử dụng danh sách có sẵn
                        </h5>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Sử dụng danh sách {wizardPreviewItems.length} học sinh hiện tại của lớp {activeTargetClass.name}.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
                        <span>Đã có {wizardPreviewItems.length} học sinh</span>
                        {dataSourceType === 'existing' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </div>
                    </div>

                    {/* Option B: Upload Excel */}
                    <div
                      onClick={() => {
                        setDataSourceType('excel');
                        soundFx.playClick();
                      }}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                        dataSourceType === 'excel'
                          ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl mb-3">
                          📥
                        </div>
                        <h5 className="font-black text-slate-900 text-sm mb-1">
                          Cách 2: Tải lên file Excel (.xlsx)
                        </h5>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Nhập danh sách học sinh từ file Excel chuẩn của trường để vừa thêm học sinh vừa cấp tài khoản.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                        <span>Hỗ trợ .xlsx / .xls</span>
                        {dataSourceType === 'excel' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </div>
                    </div>
                  </div>

                  {/* If Excel chosen, file uploader area */}
                  {dataSourceType === 'excel' && (
                    <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-2">
                      <FileSpreadsheet className="w-8 h-8 text-emerald-600 mx-auto" />
                      <div className="text-xs font-black text-slate-800">
                        {excelFile ? `Đã chọn: ${excelFile.name}` : 'Kéo thả file Excel hoặc bấm chọn'}
                      </div>
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        id="wizard-excel-input"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleExcelUpload(file);
                        }}
                      />
                      <label
                        htmlFor="wizard-excel-input"
                        className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition"
                      >
                        {excelFile ? 'Chọn file khác' : 'Chọn file Excel'}
                      </label>
                      <button
                        type="button"
                        onClick={() => downloadStudentTemplate(activeTargetClass?.classCode || 'Lop2')}
                        className="block mx-auto text-[11px] font-bold text-blue-600 underline mt-1"
                      >
                        Tải file Excel mẫu tại đây
                      </button>

                      {isParsingExcel && (
                        <div className="text-xs text-blue-600 font-bold animate-pulse">
                          Đang đọc và kiểm tra dữ liệu file...
                        </div>
                      )}
                      {excelErrors.length > 0 && (
                        <div className="text-left bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded-xl font-bold">
                          {excelErrors.map((err, i) => (
                            <div key={i}>• {err}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* BƯỚC 4: Hiển thị bản xem trước */}
              {wizardStep === 4 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-slate-900">
                        Bước 4: Bản xem trước danh sách cấp tài khoản
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold">
                        STT | Họ và tên | Mã học sinh | Tên đăng nhập | Trạng thái tài khoản
                      </p>
                    </div>
                    <span className="text-xs font-black bg-blue-100 text-blue-800 px-2.5 py-1 rounded-xl">
                      {wizardPreviewItems.length} học sinh
                    </span>
                  </div>

                  {/* Overwrite toggle */}
                  <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Chỉ tạo cho học sinh CHƯA CÓ tài khoản (khuyên dùng):</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={skipAlreadyHasAccount}
                      onChange={(e) => setSkipAlreadyHasAccount(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </div>

                  {/* Preview Table */}
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase">
                        <tr>
                          <th className="p-2.5 text-center w-10">STT</th>
                          <th className="p-2.5">Họ và tên</th>
                          <th className="p-2.5">Mã HS</th>
                          <th className="p-2.5">Tên đăng nhập dự kiến</th>
                          <th className="p-2.5 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {wizardPreviewItems.map((item) => (
                          <tr key={item.stt} className="hover:bg-slate-50">
                            <td className="p-2.5 text-center text-slate-400 font-bold">{item.stt}</td>
                            <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                            <td className="p-2.5 font-mono text-blue-800">{item.studentCode}</td>
                            <td className="p-2.5 font-mono font-bold text-slate-700">{item.username}</td>
                            <td className="p-2.5 text-center">
                              {item.hasAccount ? (
                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  Đã có tài khoản
                                </span>
                              ) : (
                                <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  Sẵn sàng tạo mới
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* BƯỚC 5: Giáo viên xác nhận tạo tài khoản */}
              {wizardStep === 5 && (
                <div className="py-4 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-inner animate-pulse">
                    🚀
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900">
                      Bước 5: Xác Nhận Cấp Tài Khoản Cho Lớp {activeTargetClass.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto mt-1">
                      Thầy cô chuẩn bị cấp tài khoản cho <strong>{wizardPreviewItems.length} học sinh</strong>.
                    </p>
                  </div>

                  <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 text-xs text-amber-900 text-left max-w-md mx-auto space-y-1.5 font-semibold">
                    <div className="font-black text-slate-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Lưu ý quan trọng trước khi xác nhận:</span>
                    </div>
                    <div>• Mật khẩu ban đầu sẽ chỉ hiển thị ở Bước 6 để thầy cô xuất file Excel hoặc in.</div>
                    <div>• Không tự ý xóa hoặc làm mất kết quả học tập cũ của học sinh.</div>
                    <div>• Tài khoản sau khi tạo sẽ đăng nhập được ngay bằng Mã lớp, Tên đăng nhập và Mật khẩu.</div>
                  </div>
                </div>
              )}

              {/* BƯỚC 6: Hệ thống tạo tài khoản và báo cáo kết quả chi tiết */}
              {wizardStep === 6 && batchResult && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <h4 className="font-black text-sm text-emerald-950">
                        Bước 6: Hoàn Tất Cấp Tài Khoản Thành Công! 🎉
                      </h4>
                      <p className="text-emerald-800 font-semibold mt-0.5">
                        Đã tạo mới <strong>{batchResult.newlyCreatedCount}</strong> tài khoản • Giữ nguyên{' '}
                        <strong>{batchResult.alreadyExistedCount}</strong> tài khoản đã có • Lỗi:{' '}
                        <strong>{batchResult.failedCount}</strong>
                      </p>
                    </div>
                  </div>

                  {/* CRITICAL SECURITY WARNING */}
                  <div className="bg-rose-50 border-2 border-rose-300 p-3.5 rounded-2xl text-xs text-rose-900 font-semibold space-y-1">
                    <strong className="font-black flex items-center gap-1 text-rose-950">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      CẢNH BÁO BẢO MẬT: MẬT KHẨU CHỈ HIỂN THỊ MỘT LẦN!
                    </strong>
                    <p>
                      Mật khẩu ban đầu của học sinh chỉ xuất hiện một lần duy nhất trong bảng dưới đây. Để bảo mật tối đa, hệ thống không lưu mật khẩu dạng văn bản thuần. Thầy cô vui lòng <strong>Tải file Excel</strong> hoặc <strong>In danh sách</strong> ngay bây giờ để gửi riêng cho phụ huynh!
                    </p>
                  </div>

                  {/* Result Table with Plain Passwords Displayed ONCE */}
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase">
                        <tr>
                          <th className="p-2.5 text-center w-10">STT</th>
                          <th className="p-2.5">Họ và tên</th>
                          <th className="p-2.5">Mã HS</th>
                          <th className="p-2.5">Tên đăng nhập</th>
                          <th className="p-2.5 text-center">Mật khẩu ban đầu</th>
                          <th className="p-2.5 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {batchResult.items.map((item) => (
                          <tr key={item.stt} className="hover:bg-slate-50">
                            <td className="p-2.5 text-center text-slate-400 font-bold">{item.stt}</td>
                            <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                            <td className="p-2.5 font-mono text-blue-800">{item.studentCode}</td>
                            <td className="p-2.5 font-mono font-black text-slate-800">{item.username}</td>
                            <td className="p-2.5 text-center">
                              <span className="font-mono font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300">
                                {item.initialPassword || '••••'}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              {item.status === 'created' ? (
                                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  Tạo mới ✓
                                </span>
                              ) : item.status === 'already_exists' ? (
                                <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                  Đã có sẵn
                                </span>
                              ) : (
                                <span className="text-[10px] font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                                  Lỗi
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Export & Print actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportAccounts}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                      >
                        <Download className="w-4 h-4" />
                        <span>Tải Danh Sách Excel (.xlsx)</span>
                      </button>

                      <button
                        onClick={() => setIsPrintModalOpen(true)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                      >
                        <Printer className="w-4 h-4" />
                        <span>In Phiếu Tài Khoản</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setIsWizardOpen(false)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition"
                    >
                      Đóng cửa sổ
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Stepper Footer Controls (For Steps 1 to 5) */}
            {wizardStep < 6 && (
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between mt-4">
                <button
                  type="button"
                  disabled={wizardStep === 1}
                  onClick={() => setWizardStep((prev) => (prev > 1 ? ((prev - 1) as any) : 1))}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Quay lại
                </button>

                {wizardStep < 5 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (wizardStep === 3 && dataSourceType === 'excel' && excelParsedRows.length === 0) {
                        alert('Vui lòng chọn file Excel hợp lệ trước khi xem tiếp!');
                        return;
                      }
                      setWizardStep((prev) => (prev < 5 ? ((prev + 1) as any) : 5));
                      soundFx.playClick();
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md shadow-blue-200 transition flex items-center gap-1.5 active:scale-95"
                  >
                    <span>Tiếp tục</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleExecuteBatchCreation}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-300 transition flex items-center gap-2 active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Xác Nhận Tạo Tài Khoản</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: CẤP LẠI MẬT KHẨU HỌC SINH QUÊN (PHẦN 5)                        */}
      {/* ========================================================================= */}
      {resetModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-pop">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-amber-300 relative">
            <button
              onClick={() => setResetModalStudent(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl p-2 bg-amber-100 rounded-2xl">{resetModalStudent.avatar}</span>
              <div>
                <h3 className="font-black text-slate-900 text-base">Cấp Lại Mật Khẩu Mới</h3>
                <p className="text-xs font-semibold text-slate-500">
                  Học sinh: {resetModalStudent.name} ({resetModalStudent.studentCode})
                </p>
              </div>
            </div>

            {resetResultPassword ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                  <div className="text-xs font-bold text-emerald-800">Cấp lại mật khẩu thành công!</div>
                  <div className="font-mono text-2xl font-black text-emerald-950 tracking-wider">
                    {resetResultPassword}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Mật khẩu đã được mã hóa an toàn và áp dụng ngay lập tức.
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(resetResultPassword);
                      setIsCopiedResetPass(true);
                      soundFx.playClick();
                      setTimeout(() => setIsCopiedResetPass(false), 2000);
                    }}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    {isCopiedResetPass ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopiedResetPass ? 'Đã sao chép' : 'Sao chép gửi phụ huynh'}</span>
                  </button>

                  <button
                    onClick={() => setResetModalStudent(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-semibold">
                  Mật khẩu mới sẽ được tạo ngẫu nhiên 4 số an toàn, dễ bấm cho học sinh lớp 2. Thầy cô cũng có thể tự đặt mật khẩu riêng nếu muốn.
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    Mật khẩu mới (để trống hệ thống sẽ tự sinh ngẫu nhiên):
                  </label>
                  <input
                    type="text"
                    value={customPasswordInput}
                    onChange={(e) => setCustomPasswordInput(e.target.value)}
                    placeholder="VD: 5821 (hoặc để trống)"
                    maxLength={8}
                    className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-mono font-bold text-sm text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition"
                  >
                    Tạo & Cấp Mật Khẩu Mới
                  </button>

                  <button
                    type="button"
                    onClick={() => setResetModalStudent(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: CẤP TÀI KHOẢN CHO 1 HỌC SINH                                   */}
      {/* ========================================================================= */}
      {createModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-pop">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-amber-300 relative">
            <button
              onClick={() => setCreateModalStudent(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl p-2 bg-blue-100 rounded-2xl">{createModalStudent.avatar}</span>
              <div>
                <h3 className="font-black text-slate-900 text-base">Cấp Tài Khoản Học Sinh</h3>
                <p className="text-xs font-semibold text-slate-500">
                  {createModalStudent.name} • {createModalStudent.classCode}
                </p>
              </div>
            </div>

            {createResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <div className="font-bold text-center text-emerald-900">Tạo tài khoản thành công!</div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 font-mono space-y-1">
                    <div>
                      Tên đăng nhập: <strong>{createResult.username}</strong>
                    </div>
                    <div>
                      Mật khẩu ban đầu: <strong>{createResult.pass}</strong>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 text-center">
                    Hãy lưu lại để phát cho phụ huynh học sinh nhé!
                  </div>
                </div>

                <button
                  onClick={() => setCreateModalStudent(null)}
                  className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition"
                >
                  Xong & Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateAccountSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Tên đăng nhập:</label>
                  <input
                    type="text"
                    value={customUsernameInput}
                    onChange={(e) => setCustomUsernameInput(e.target.value.toLowerCase())}
                    className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-mono font-bold text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 font-semibold">Tự động sinh theo tên & lớp</span>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Mật khẩu ban đầu:</label>
                  <input
                    type="text"
                    value={customNewPassInput}
                    onChange={(e) => setCustomNewPassInput(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-mono font-bold text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 font-semibold">Mật khẩu 4 số dễ bấm cho lớp 2</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs transition"
                  >
                    Xác Nhận Cấp Tài Khoản
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateModalStudent(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: IN THẺ PHIẾU ĐĂNG NHẬP PHÁT CHO HỌC SINH (PHẦN 5)               */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-pop">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl border-4 border-amber-300 relative flex flex-col justify-between">
            <button
              onClick={() => setIsPrintModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Print Header */}
            <div className="print:hidden mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Printer className="w-5 h-5 text-blue-600" />
                    <span>In Thẻ Thông Tin Tài Khoản Học Sinh</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Mỗi phiếu chứa đầy đủ thông tin đăng nhập và hướng dẫn cho học sinh và phụ huynh.
                  </p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Bấm In Ngay (Ctrl + P)</span>
                </button>
              </div>
            </div>

            {/* Printable Grid of Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-2">
              {classStudents.map((s, idx) => (
                <div
                  key={s.id}
                  className="border-2 border-dashed border-slate-300 p-4 rounded-2xl bg-white shadow-xs break-inside-avoid relative"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl select-none">🐝</span>
                      <div>
                        <div className="font-black text-xs text-blue-900">AI LEARN – TRẠM HỌC TẬP</div>
                        <div className="text-[9px] text-slate-500 font-bold">{currentTeacher?.schoolName || 'Trường Tiểu học'}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                      LỚP {s.classCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 my-2">
                    <span className="text-3xl p-1.5 bg-slate-100 rounded-xl">{s.avatar}</span>
                    <div className="flex-1">
                      <div className="font-black text-sm text-slate-900">{s.name}</div>
                      <div className="text-[10px] font-bold text-slate-500">Mã học sinh: {s.studentCode}</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans font-bold">1. Mã lớp:</span>
                      <strong className="text-blue-900 font-black">{s.classCode}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans font-bold">2. Tên đăng nhập:</span>
                      <strong className="text-slate-900 font-black">{s.username || s.studentCode.toLowerCase()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans font-bold">3. Mật khẩu ban đầu:</span>
                      <strong className="text-amber-800 font-black">
                        {s.initialPasswordPlain || s.pin || '1234'}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-2 text-[9px] text-slate-500 font-semibold text-center">
                    Cắt theo viền nét đứt và dán vào sổ liên lạc hoặc phát cho phụ huynh.
                  </div>
                </div>
              ))}
            </div>

            <div className="print:hidden mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
