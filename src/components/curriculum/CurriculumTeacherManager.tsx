import React, { useState, useMemo } from 'react';
import { Subject } from '../../types';
import { CurriculumVolume, CurriculumLesson, AssignedHomework } from '../../types/curriculum';
import {
  getLessonsBySubjectAndVolume,
  MATH_LESSONS,
  VIET_LESSONS,
} from '../../data/curriculumData';
import { useApp } from '../../context/AppContext';
import { soundFx } from '../../utils/sound';
import * as XLSX from 'xlsx';
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Award,
  ChevronRight,
  Send,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';

export const CurriculumTeacherManager: React.FC = () => {
  const {
    currentClass,
    students,
    assignedHomeworks,
    studentLessonResults,
    teacherAssignHomework,
  } = useApp();

  const [selectedSubject, setSelectedSubject] = useState<Subject>('math');
  const [selectedVolume, setSelectedVolume] = useState<CurriculumVolume>(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Assign modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLessonForAssign, setSelectedLessonForAssign] = useState<CurriculumLesson | null>(null);
  const [assignLevel, setAssignLevel] = useState<'basic' | 'reinforce' | 'advanced'>('basic');
  const [assignDueDate, setAssignDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [assignTargetType, setAssignTargetType] = useState<'all' | 'need_support' | 'custom'>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [teacherNote, setTeacherNote] = useState('Các con hoàn thành trước hạn nộp để nhận sao chăm chỉ nhé!');

  // Detailed view of homework modal
  const [viewingHomework, setViewingHomework] = useState<AssignedHomework | null>(null);

  const lessons = useMemo(
    () => getLessonsBySubjectAndVolume(selectedSubject, selectedVolume),
    [selectedSubject, selectedVolume]
  );

  const filteredLessons = useMemo(() => {
    return lessons.filter((l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      l.themeName.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [lessons, searchQuery]);

  // Open assign modal for a specific lesson
  const handleOpenAssignModal = (lesson: CurriculumLesson) => {
    setSelectedLessonForAssign(lesson);
    setIsAssignModalOpen(true);
    soundFx.playClick();
  };

  // Submit assign homework
  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLessonForAssign) return;

    const today = new Date().toISOString().split('T')[0];
    teacherAssignHomework({
      lessonId: selectedLessonForAssign.id,
      lessonTitle: selectedLessonForAssign.title,
      subject: selectedLessonForAssign.subject,
      volume: selectedLessonForAssign.volume,
      assignedDate: today,
      dueDate: assignDueDate,
      level: assignLevel,
      targetType: assignTargetType,
      targetStudentIds: assignTargetType === 'custom' ? selectedStudentIds : [],
      noteFromTeacher: teacherNote.trim(),
    });

    setIsAssignModalOpen(false);
    alert(`Đã giao thành công bài "${selectedLessonForAssign.title}" cho học sinh ${currentClass?.name || 'lớp'}! 🚀`);
  };

  // Export homework report to Excel (.xlsx) (Phần 7)
  const handleExportHomeworkExcel = (hw: AssignedHomework) => {
    const rows = students.map((s, idx) => {
      const sub = (hw.submissions || []).find((sub) => sub.studentId === s.id);
      return {
        'STT': idx + 1,
        'Mã học sinh': s.studentCode,
        'Họ và tên': s.name,
        'Trạng thái': sub ? 'Đã hoàn thành ✅' : 'Chưa nộp bài ⏳',
        'Thời gian nộp': sub ? sub.completedAt : 'Chưa có',
        'Điểm số': sub ? `${sub.score} / 100` : 0,
        'Số câu đúng': sub ? `${sub.correctCount} / ${sub.totalQuestions}` : '0',
        'Nhận xét của cô': sub ? sub.teacherRemark || 'Đạt yêu cầu' : 'Chưa nộp',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 15 },
      { wch: 30 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BaoCaoBaiTap');
    XLSX.writeFile(wb, `Bao_Cao_Bai_Tap_${hw.lessonTitle.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
    soundFx.playCorrect();
  };

  return (
    <div className="space-y-6 animate-pop">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-black uppercase text-amber-300 mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              Góc Giáo Viên • Phân Phối Chương Trình SGK Kết Nối Tri Thức
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Quản Lý Bài Học & Giao Bài - {currentClass?.name || 'Khối 2'}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 font-semibold mt-0.5">
              Chọn bài theo mục lục chính xác SGK, đặt hạn nộp, theo dõi tiến độ nộp bài của từng em
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/15 p-1 rounded-2xl border border-white/20">
            <button
              onClick={() => setSelectedSubject('math')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition ${
                selectedSubject === 'math' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-white'
              }`}
            >
              🧮 Toán Lớp 2
            </button>
            <button
              onClick={() => setSelectedSubject('vietnamese')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition ${
                selectedSubject === 'vietnamese' ? 'bg-blue-500 text-white shadow-md' : 'text-white'
              }`}
            >
              📖 Tiếng Việt Lớp 2
            </button>
          </div>
        </div>
      </div>

      {/* Assigned Homeworks List */}
      <div className="bg-white rounded-3xl p-6 border-3 border-slate-100 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Danh Sách Bài Tập Đã Giao ({assignedHomeworks.length} nhiệm vụ)
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                Theo dõi tỉ lệ nộp bài, điểm số và xuất báo cáo Excel
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {assignedHomeworks.map((hw) => {
            const submittedCount = (hw.submissions || []).length;
            const totalTarget = hw.targetType === 'all' ? students.length : (hw.targetStudentIds || []).length;
            const percentDone = Math.round((submittedCount / Math.max(totalTarget, 1)) * 100);

            return (
              <div
                key={hw.id}
                className="p-4 rounded-2xl border-2 border-slate-200 hover:border-indigo-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                      {hw.subject === 'math' ? 'Toán' : 'Tiếng Việt'} • Tập {hw.volume}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      Hạn nộp: <strong className="text-rose-600">{hw.dueDate}</strong>
                    </span>
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">{hw.lessonTitle}</h4>
                  <p className="text-xs text-slate-600 italic mt-0.5">&quot;{hw.noteFromTeacher}&quot;</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-800">
                      Đã nộp: <span className="text-indigo-600">{submittedCount}/{totalTarget} em</span> ({percentDone}%)
                    </div>
                    <div className="w-28 h-2 bg-slate-200 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percentDone}%` }}></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewingHomework(hw)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-200 transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Chi tiết</span>
                    </button>
                    <button
                      onClick={() => handleExportHomeworkExcel(hw)}
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition"
                      title="Xuất bảng điểm ra Excel"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lesson Catalog for Selected Subject & Volume */}
      <div className="bg-white rounded-3xl p-6 border-3 border-slate-100 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Mục Lục SGK {selectedSubject === 'math' ? 'Toán' : 'Tiếng Việt'} Lớp 2 (Tập {selectedVolume})
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Bấm &quot;Giao bài này&quot; để tạo nhiệm vụ học tập cho học sinh {currentClass?.name || 'lớp'}
            </p>
          </div>

          {/* Volume toggle */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-black">
              <button
                onClick={() => setSelectedVolume(1)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedVolume === 1 ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Tập 1
              </button>
              <button
                onClick={() => setSelectedVolume(2)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedVolume === 2 ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Tập 2
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm bài học cần giao..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
          />
        </div>

        {/* Table of Lessons */}
        <div className="overflow-x-auto max-h-96 rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 font-black text-slate-600">
                <th className="p-3">Bài</th>
                <th className="p-3">Tên bài học SGK</th>
                <th className="p-3">Chủ đề</th>
                <th className="p-3">Yêu cầu cần đạt</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLessons.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-black text-blue-700">#{l.lessonNumber}</td>
                  <td className="p-3 font-black text-slate-900">{l.title}</td>
                  <td className="p-3 text-slate-600 text-[11px] font-semibold">{l.themeName.split(':')[0]}</td>
                  <td className="p-3 text-slate-500 text-[11px] font-medium max-w-xs truncate">
                    {l.learningGoals[0]}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleOpenAssignModal(l)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs transition"
                    >
                      Giao bài 📝
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: GIAO BÀI CHO LỚP HỌC ================= */}
      {isAssignModalOpen && selectedLessonForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-pop">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-blue-300 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAssignModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📝</span>
              <h3 className="text-lg font-black text-slate-900">
                Giao Bài Tập Cho {currentClass?.name || 'Lớp Học'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-semibold mb-5">
              Bài học: <strong>{selectedLessonForAssign.title}</strong>
            </p>

            <form onSubmit={handleConfirmAssign} className="space-y-4 text-xs font-bold text-slate-700">
              {/* Level */}
              <div>
                <label className="block mb-1">Mức độ bài tập:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'basic', label: 'Cơ bản' },
                    { id: 'reinforce', label: 'Củng cố' },
                    { id: 'advanced', label: 'Nâng cao' },
                  ].map((lv) => (
                    <button
                      type="button"
                      key={lv.id}
                      onClick={() => setAssignLevel(lv.id as any)}
                      className={`p-2.5 rounded-xl border-2 text-center transition ${
                        assignLevel === lv.id
                          ? 'bg-blue-50 border-blue-600 text-blue-900 font-black'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {lv.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due date */}
              <div>
                <label className="block mb-1">Hạn nộp bài:</label>
                <input
                  type="date"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  required
                />
              </div>

              {/* Target Type */}
              <div>
                <label className="block mb-1">Giao cho đối tượng:</label>
                <select
                  value={assignTargetType}
                  onChange={(e) => setAssignTargetType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="all">Toàn bộ học sinh {currentClass?.name || 'lớp'} ({students.length} em)</option>
                  <option value="need_support">Nhóm học sinh cần hỗ trợ thêm</option>
                  <option value="custom">Chọn học sinh cụ thể...</option>
                </select>
              </div>

              {/* Student checkboxes if custom */}
              {assignTargetType === 'custom' && (
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
                  {students.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-xs p-1 hover:bg-white rounded">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudentIds((prev) => [...prev, s.id]);
                          } else {
                            setSelectedStudentIds((prev) => prev.filter((id) => id !== s.id));
                          }
                        }}
                      />
                      <span>
                        {s.studentCode} - {s.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* Teacher Note */}
              <div>
                <label className="block mb-1">Lời nhắn của cô gửi học sinh:</label>
                <textarea
                  rows={2}
                  value={teacherNote}
                  onChange={(e) => setTeacherNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-normal"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Xác nhận giao bài 🚀</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CHI TIẾT NỘP BÀI TẬP ================= */}
      {viewingHomework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-pop">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border-4 border-indigo-300 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewingHomework(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Tình Hình Nộp Bài: {viewingHomework.lessonTitle}
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Hạn nộp: {viewingHomework.dueDate} • Đã nộp: {(viewingHomework.submissions || []).length} / {students.length} em
                </p>
              </div>

              <button
                onClick={() => handleExportHomeworkExcel(viewingHomework)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Excel</span>
              </button>
            </div>

            {/* Submissions list */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 font-black text-slate-600">
                    <th className="p-3">Học sinh</th>
                    <th className="p-3">Thời gian nộp</th>
                    <th className="p-3">Điểm số</th>
                    <th className="p-3">Kết quả</th>
                    <th className="p-3">Nhận xét của cô</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => {
                    const sub = (viewingHomework.submissions || []).find((sub) => sub.studentId === s.id);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                          <span>{s.avatar}</span>
                          <span>{s.name}</span>
                          <span className="font-mono text-slate-400 text-[10px]">({s.studentCode})</span>
                        </td>
                        <td className="p-3 text-slate-500">{sub ? sub.completedAt : <span className="text-rose-500 font-semibold italic">Chưa nộp</span>}</td>
                        <td className="p-3 font-black text-blue-700">{sub ? `${sub.score} đ` : '-'}</td>
                        <td className="p-3">
                          {sub ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                              {sub.correctCount}/{sub.totalQuestions} đúng
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                              Đang chờ
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 text-[11px] italic">
                          {sub?.teacherRemark || 'Chưa có nhận xét'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
