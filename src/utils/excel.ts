import * as XLSX from 'xlsx';
import { Student } from '../types';

export interface ParsedStudentRow {
  stt?: number;
  studentCode: string;
  name: string;
  birthday: string;
  gender: 'Nam' | 'Nữ';
  notes: string;
  isValid: boolean;
  validationError?: string;
}

/**
 * Download standard Excel template for Class student list.
 * Columns: STT | Mã học sinh | Họ và tên | Ngày sinh | Giới tính | Ghi chú
 */
export function downloadStudentTemplate(classCode: string = 'Lop2') {
  const templateData = [
    {
      'STT': 1,
      'Mã học sinh': 'HS01',
      'Họ và tên': 'Nguyễn Minh Anh',
      'Ngày sinh': '15/08/2018',
      'Giới tính': 'Nữ',
      'Ghi chú': 'Học sinh chăm chỉ, tổ trưởng tổ 1',
    },
    {
      'STT': 2,
      'Mã học sinh': 'HS02',
      'Họ và tên': 'Trần Tuấn Kiệt',
      'Ngày sinh': '03/04/2018',
      'Giới tính': 'Nam',
      'Ghi chú': 'Nhanh nhẹn, có năng khiếu tính nhẩm',
    },
    {
      'STT': 3,
      'Mã học sinh': 'HS03',
      'Họ và tên': 'Lê Bảo Châu',
      'Ngày sinh': '22/11/2018',
      'Giới tính': 'Nữ',
      'Ghi chú': 'Chữ viết đẹp, thích môn Tiếng Việt',
    },
    {
      'STT': 4,
      'Mã học sinh': '', // Empty code demonstration (will be auto-generated)
      'Họ và tên': 'Phạm Đức Minh',
      'Ngày sinh': '09/01/2018',
      'Giới tính': 'Nam',
      'Ghi chú': 'Để trống mã hệ thống sẽ tự sinh mã HS tiếp theo',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);

  // Set nice column widths
  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 15 }, // Mã học sinh
    { wch: 25 }, // Họ và tên
    { wch: 15 }, // Ngày sinh
    { wch: 12 }, // Giới tính
    { wch: 35 }, // Ghi chú
  ];

  const wb = XLSX.utils.book_new();
  const safeCode = classCode.replace(/\s+/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, `DanhSach_${safeCode}`);

  XLSX.writeFile(wb, `Mau_Danh_Sach_Hoc_Sinh_${safeCode}.xlsx`);
}

/**
 * Export current students roster to a real Excel (.xlsx) file with full academic metrics.
 */
export function exportStudentsToExcel(students: Student[], classCode: string = 'Lop2') {
  const exportData = students.map((s, idx) => {
    const totalLessons = s.mathProgress.completedLessons + s.vietnameseProgress.completedLessons;
    const avgAcc = Math.round((s.mathProgress.accuracy + s.vietnameseProgress.accuracy) / 2);
    
    let progressLevel = 'Đạt chuẩn';
    if (avgAcc >= 90 && totalLessons >= 10) progressLevel = 'Xuất sắc ⭐';
    else if (avgAcc >= 80) progressLevel = 'Tiến bộ nhanh 🚀';
    else if (avgAcc < 75 || totalLessons < 5) progressLevel = 'Cần hỗ trợ thêm ⚠️';

    return {
      'STT': idx + 1,
      'Mã học sinh': s.studentCode,
      'Họ và tên': s.name,
      'Lớp': s.classCode || classCode,
      'Ngày sinh': s.birthday || 'Chưa cập nhật',
      'Giới tính': s.gender || 'Nam',
      'Mã PIN cá nhân': s.pin,
      'Tổng số bài đã làm': totalLessons,
      'Điểm Toán (%)': `${s.mathProgress.accuracy}% (${s.mathProgress.correctAnswers}/${s.mathProgress.totalQuestions})`,
      'Điểm Tiếng Việt (%)': `${s.vietnameseProgress.accuracy}% (${s.vietnameseProgress.correctAnswers}/${s.vietnameseProgress.totalQuestions})`,
      'Số ngày học tích cực': s.streakDays,
      'Điểm thi đua': s.totalPoints,
      'Sao tích lũy': s.totalStars,
      'Mức độ tiến bộ': progressLevel,
      'Ghi chú của cô': s.teacherNotes,
    };
  });

  const ws = XLSX.utils.json_to_sheet(exportData);

  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 14 }, // Mã học sinh
    { wch: 24 }, // Họ và tên
    { wch: 10 }, // Lớp
    { wch: 14 }, // Ngày sinh
    { wch: 10 }, // Giới tính
    { wch: 15 }, // Mã PIN
    { wch: 18 }, // Tổng số bài đã làm
    { wch: 20 }, // Điểm Toán
    { wch: 22 }, // Điểm Tiếng Việt
    { wch: 20 }, // Số ngày học tích cực
    { wch: 14 }, // Điểm thi đua
    { wch: 14 }, // Sao tích lũy
    { wch: 18 }, // Mức độ tiến bộ
    { wch: 35 }, // Ghi chú
  ];

  const wb = XLSX.utils.book_new();
  const safeCode = classCode.replace(/\s+/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, `HocSinh_${safeCode}`);

  const todayStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Danh_Sach_Hoc_Sinh_${safeCode}_${todayStr}.xlsx`);
}

/**
 * Export student credentials list to Excel.
 * Columns: STT | Họ và tên | Lớp | Tên đăng nhập | Mật khẩu ban đầu | Trạng thái tạo tài khoản
 * Required by User Request (Phần 5: Xuất danh sách tài khoản)
 */
export function exportStudentAccountsToExcel(
  items: Array<{
    stt: number;
    name: string;
    classCode: string;
    studentCode?: string;
    username: string;
    initialPassword?: string;
    status: string;
  }>,
  classCode: string = 'Lop2'
) {
  const exportData = items.map((item) => ({
    'STT': item.stt,
    'Họ và tên': item.name,
    'Lớp': item.classCode || classCode,
    'Mã học sinh': item.studentCode || '',
    'Tên đăng nhập': item.username,
    'Mật khẩu ban đầu': item.initialPassword || '(Đã bảo mật mã hóa)',
    'Trạng thái tạo tài khoản': item.status,
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);

  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 26 }, // Họ và tên
    { wch: 12 }, // Lớp
    { wch: 14 }, // Mã học sinh
    { wch: 22 }, // Tên đăng nhập
    { wch: 20 }, // Mật khẩu ban đầu
    { wch: 24 }, // Trạng thái tạo tài khoản
  ];

  const wb = XLSX.utils.book_new();
  const safeCode = classCode.replace(/\s+/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, `TaiKhoan_${safeCode}`);

  const todayStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `TaiKhoan_HocSinh_${safeCode}_${todayStr}.xlsx`);
}

/**
 * Parse uploaded .xlsx or .xls file and return preview rows with validations.
 */
export async function parseStudentExcelFile(
  file: File,
  existingCodes: Set<string>
): Promise<{
  rows: ParsedStudentRow[];
  hasErrors: boolean;
  errorMessages: string[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const wb = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];

        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve({
            rows: [],
            hasErrors: true,
            errorMessages: ['File Excel không có dữ liệu dòng nào.'],
          });
          return;
        }

        const rows: ParsedStudentRow[] = [];
        const errorMessages: string[] = [];
        const seenCodesInFile = new Set<string>();

        rawJson.forEach((row, index) => {
          const rowNum = index + 2; // Excel row number (1-based header is row 1)

          // Flexible header mapping
          const stt = Number(row['STT'] || row['stt'] || index + 1);
          let studentCode = String(
            row['Mã học sinh'] || row['Mã HS'] || row['Ma hoc sinh'] || row['Ma HS'] || row['MÃ HỌC SINH'] || ''
          ).trim();
          const name = String(
            row['Họ và tên'] || row['Họ tên'] || row['Ho va ten'] || row['Tên học sinh'] || row['HỌ VÀ TÊN'] || ''
          ).trim();
          const birthday = String(
            row['Ngày sinh'] || row['Ngay sinh'] || row['NGÀY SINH'] || row['Năm sinh'] || '15/08/2018'
          ).trim();
          const genderRaw = String(
            row['Giới tính'] || row['Gioi tinh'] || row['GIỚI TÍNH'] || 'Nam'
          ).trim().toLowerCase();
          const gender: 'Nam' | 'Nữ' = genderRaw === 'nữ' || genderRaw === 'nu' || genderRaw === 'female' ? 'Nữ' : 'Nam';
          const notes = String(row['Ghi chú'] || row['Ghi chu'] || row['GHI CHÚ'] || '').trim();

          let isValid = true;
          let validationError = '';

          // Validate Name
          if (!name) {
            isValid = false;
            validationError = `Dòng ${rowNum}: Thiếu Họ và tên học sinh.`;
            errorMessages.push(validationError);
          }

          // Check duplicate student code within the file itself
          if (studentCode) {
            const upperCode = studentCode.toUpperCase();
            if (seenCodesInFile.has(upperCode)) {
              isValid = false;
              validationError = `Dòng ${rowNum}: Mã "${studentCode}" bị trùng lặp trong file.`;
              errorMessages.push(validationError);
            } else {
              seenCodesInFile.add(upperCode);
            }
          }

          rows.push({
            stt,
            studentCode,
            name,
            birthday: birthday || '15/08/2018',
            gender,
            notes,
            isValid,
            validationError,
          });
        });

        resolve({
          rows,
          hasErrors: errorMessages.length > 0,
          errorMessages,
        });
      } catch (err: any) {
        reject(new Error('Không thể đọc file Excel. Vui lòng kiểm tra định dạng .xlsx hoặc .xls.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Lỗi khi đọc file.'));
    };

    reader.readAsArrayBuffer(file);
  });
}
