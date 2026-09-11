import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Task } from '../types';
import { parseToIsoDate, formatDisplayDate } from '../utils/dateUtils';
import { X, Upload, FileSpreadsheet, Check, AlertCircle, FileText } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportAppend: (newTasks: Omit<Task, 'id' | 'stt'>[]) => void;
  currentTasksCount: number;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportAppend,
  currentTasksCount,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [pastedText, setPastedText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Omit<Task, 'id' | 'stt'>[]>([]);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Process raw imported data rows into Task objects
  const processRawRows = (rows: any[]) => {
    const tasks: Omit<Task, 'id' | 'stt'>[] = [];

    rows.forEach((row, idx) => {
      // Flexibly map column names or array indexes
      const keys = Object.keys(row);

      // Find key matching "số hồ sơ", "dự án", "so ho so", or 1st column
      let project = row['SỐ HỒ SỜ'] || row['So Ho So'] || row['Dự án'] || row['Du an'] || row[keys[0]] || '';
      let handler = row['CÁN BỘ XỬ LÝ'] || row['Can Bo Xu Ly'] || row['Cán bộ'] || row[keys[1]] || '';
      let ngayNhan = row['NGÀY NHẬN'] || row['Ngay Nhan'] || row['Bắt đầu'] || row[keys[2]] || '';
      let ngayTra = row['NGÀY TRẢ'] || row['Ngay Tra'] || row['Kết thúc'] || row['Hạn trả'] || row[keys[3]] || '';
      let taskName = row['TÊN CÔNG VIỆC'] || row['Tên công việc'] || row['Công việc'] || '';

      // Skip header rows or empty rows
      if (!project && !handler && !ngayNhan && !ngayTra) return;
      if (String(project).toLowerCase().includes('số hồ sơ') || String(handler).toLowerCase().includes('cán bộ')) return;

      const startDateIso = parseToIsoDate(ngayNhan);
      const endDateIso = parseToIsoDate(ngayTra);

      // If task name is missing (like in image 2), generate descriptive task name from file number
      if (!taskName) {
        taskName = `Xử lý hồ sơ ${project}`;
      }

      tasks.push({
        project: String(project).trim(),
        taskName: String(taskName).trim(),
        handler: String(handler).trim() || 'Chưa phân công',
        priority: 'Trung bình',
        startDate: startDateIso,
        endDate: endDateIso,
        completed: false,
        notes: `Import ngày ${new Date().toLocaleDateString('vi-VN')}`,
      });
    });

    setParsedPreview(tasks);
    setImportMessage(`Đã trích xuất thành công ${tasks.length} dòng dữ liệu.`);
  };

  // Handle File Upload (.xlsx, .xls, .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processRawRows(results.data);
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsName = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Convert 2D array to object array if header row exists
        if (data.length > 0) {
          const headers = (data[0] as any[]).map((h) => String(h).trim().toUpperCase());
          const rows = data.slice(1).map((rowArr: any) => {
            const rowObj: any = {};
            headers.forEach((h, i) => {
              rowObj[h] = rowArr[i];
            });
            return rowObj;
          });
          processRawRows(rows);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  // Handle Pasted Text Parsing
  const handleParseText = () => {
    if (!pastedText.trim()) return;

    const lines = pastedText.trim().split('\n');
    const rows = lines.map((line) => {
      // Split by Tab or Comma
      const parts = line.split(line.includes('\t') ? '\t' : ',');
      return {
        'SỐ HỒ SỜ': parts[0] || '',
        'CÁN BỘ XỬ LÝ': parts[1] || '',
        'NGÀY NHẬN': parts[2] || '',
        'NGÀY TRẢ': parts[3] || '',
      };
    });

    processRawRows(rows);
  };

  // Execute Import (Append to existing data)
  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) return;
    onImportAppend(parsedPreview);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0f4c4a] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-300" />
              Import Dữ Liệu Hồ Sơ (Không đè dữ liệu gốc)
            </h2>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Dữ liệu mới sẽ được thêm nối tiếp phía dưới danh sách hiện tại ({currentTasksCount} hồ sơ hiện có).
            </p>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('file')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'file'
                ? 'border-emerald-700 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Tải File Excel (.xlsx) / CSV
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'text'
                ? 'border-emerald-700 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Dán Văn Bản / Bảng Trực Tiếp
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'file' ? (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100/80 transition relative">
              <Upload className="w-10 h-10 text-emerald-700 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                Chọn file Excel hoặc CSV từ máy tính
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Hỗ trợ mẫu chuẩn 4 cột: <span className="font-semibold text-slate-700">SỐ HỒ SỜ, CÁN BỘ XỬ LÝ, NGÀY NHẬN, NGÀY TRẢ</span>
              </p>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Dán các dòng dữ liệu (Phân cách bằng Tab hoặc Dấu phẩy):
              </label>
              <textarea
                rows={5}
                placeholder={`Mẫu dán:\n31481.G/2026/04507\tTrần Hà Trang\t05/08/2026 16:59\t12/08/2026 16:59\n31476.G/2026/04507\tNguyễn Thị Hồng\t05/08/2026 16:47\t12/08/2026 16:47`}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="w-full p-3 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50"
              />
              <button
                onClick={handleParseText}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow cursor-pointer"
              >
                Trích xuất xem trước
              </button>
            </div>
          )}

          {/* Import Status Message */}
          {importMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              {importMessage}
            </div>
          )}

          {/* Preview Table */}
          {parsedPreview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Xem trước dữ liệu trích xuất ({parsedPreview.length} hồ sơ sẽ thêm tiếp nối):
                </span>
                <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-semibold">
                  STT sẽ tiếp nối từ #{currentTasksCount + 1}
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                    <tr className="divide-x divide-slate-200">
                      <th className="p-2 w-10 text-center">#</th>
                      <th className="p-2">Số hồ sơ</th>
                      <th className="p-2">Cán bộ xử lý</th>
                      <th className="p-2 text-center">Bắt đầu</th>
                      <th className="p-2 text-center">Kết thúc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {parsedPreview.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50 divide-x divide-slate-200">
                        <td className="p-2 text-center font-bold text-slate-500">
                          {currentTasksCount + index + 1}
                        </td>
                        <td className="p-2 font-semibold text-slate-900">{item.project}</td>
                        <td className="p-2 font-medium text-teal-800">{item.handler}</td>
                        <td className="p-2 text-center font-mono">{formatDisplayDate(item.startDate)}</td>
                        <td className="p-2 text-center font-mono font-bold text-slate-900">
                          {formatDisplayDate(item.endDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={parsedPreview.length === 0}
            onClick={handleConfirmImport}
            className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow transition cursor-pointer flex items-center gap-1.5 ${
              parsedPreview.length > 0
                ? 'bg-emerald-700 hover:bg-emerald-800'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            Xác nhận Import ({parsedPreview.length} dòng tiếp nối)
          </button>
        </div>
      </div>
    </div>
  );
};
