import React, { useState } from 'react';
import { GoogleSheetConfig, Task } from '../types';
import { X, FileSpreadsheet, RefreshCw, ExternalLink, Copy, Check, Code2, Sparkles } from 'lucide-react';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetConfig;
  setConfig: React.Dispatch<React.SetStateAction<GoogleSheetConfig>>;
  tasks: Task[];
  onTriggerSyncNow: () => Promise<void>;
  onTriggerPull: () => Promise<void>;
  isSyncing: boolean;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  config,
  setConfig,
  tasks,
  onTriggerSyncNow,
  onTriggerPull,
  isSyncing,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'sync' | 'script'>('sync');
  const [isPulling, setIsPulling] = useState(false);

  const handlePull = async () => {
    setIsPulling(true);
    await onTriggerPull();
    setIsPulling(false);
  };

  if (!isOpen) return null;

  const sampleAppsScript = `/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT: TỰ ĐỘNG KHỞI TẠO, NHẬP TỪ IMPORT & CẬP NHẬT CHECKLIST CÔNG VIỆC
 * ==============================================================================
 * Hướng dẫn sử dụng:
 * 1. Mở tệp Google Sheet của bạn.
 * 2. Vào menu "Tiện ích mở rộng" (Extensions) > "Apps Script".
 * 3. Dán toàn bộ đoạn mã này vào tệp Code.gs và nhấn "Lưu" (Save - Ctrl+S).
 * 4. Tải lại trang Google Sheet. Bạn sẽ thấy Menu "📋 QLHS Checklist" xuất hiện ở trên cùng!
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("📋 QLHS Checklist")
    .addItem("1. Khởi tạo Sheet Checklist", "setupChecklistSheet")
    .addItem("2. Nhập dữ liệu từ Sheet IMPORT", "importFromImportSheet")
    .addToUi();
}

/**
 * 1. HÀM KHỞI TẠO SHEET CHECKLIST
 */
function setupChecklistSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "Checklist";
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clear();
  }
  
  // Tạo Tiêu đề mẫu (Header Row) - Hàng 14 chuẩn mẫu
  var headers = [
    "stt", "Dự án / Số hồ sơ", "Tên công việc", "Số hồ sơ", 
    "Cấp độ", "Files", "Drop?", "Bắt đầu", "Kết thúc", 
    "Tiến độ (Tick)", "Ngày hoàn thành", "Kỷ luật", "Số ngày thực hiện", "Số ngày còn lại", "Trạng thái"
  ];
  
  sheet.getRange(14, 1, 1, headers.length).setValues([headers]);
  
  // Format Header style
  var headerRange = sheet.getRange(14, 1, 1, headers.length);
  headerRange.setBackground("#0f4c4a")
             .setFontColor("#ffffff")
             .setFontWeight("bold")
             .setHorizontalAlignment("center")
             .setVerticalAlignment("middle");
             
  sheet.setRowHeight(14, 35);
  
  // Format Cột Ngày Bắt đầu (Cột H) và Kết thúc (Cột I) - Định dạng Ngày tháng năm
  sheet.getRange("H15:I100").setNumberFormat("dd/MM/yyyy").setHorizontalAlignment("center");
  sheet.getRange("K15:K100").setNumberFormat("dd/MM/yyyy").setHorizontalAlignment("center");
  
  // Chèn Checkbox cho cột Tiến độ (Cột J = Cột 10)
  sheet.getRange("J15:J100").insertCheckboxes();
  
  // 2. Thêm dữ liệu mẫu
  var sampleValues = [
    [1, "", "Thẩm định hồ sơ đất đai & cấp GCN", "31481.G/2026/04507", "Cao", "HoSo_31481.pdf", false, new Date(2026, 7, 5), new Date(2026, 7, 12), false, "", ""],
    [2, "", "Kiểm tra quy hoạch phân khu B", "31476.G/2026/04507", "Trung bình", "QuyHoach_31476.docx", false, new Date(2026, 7, 5), new Date(2026, 7, 7), false, "", ""],
    [3, "", "Rà soát nghĩa vụ tài chính đất đai", "31448.G/2026/04507", "Thấp", "Thue_31448.xlsx", false, new Date(2026, 7, 1), new Date(2026, 7, 4), false, "", ""]
  ];
  sheet.getRange(15, 1, sampleValues.length, 12).setValues(sampleValues);
  
  // 3. Tự động áp dụng Công thức cho Cột M, N, O
  var sampleFormulas = [];
  for (var r = 15; r <= 50; r++) {
    sampleFormulas.push([
      '=IF(OR(ISBLANK(H' + r + '), ISBLANK(I' + r + ')), "", IF(J' + r + '=TRUE, IF(ISBLANK(K' + r + '), I' + r + '-H' + r + '+1, K' + r + '-H' + r + '+1), I' + r + '-H' + r + '+1))',
      '=IF(J' + r + '=TRUE, "Đã xong", IF(ISBLANK(I' + r + '), "", I' + r + '-TODAY()))',
      '=IF(J' + r + '=TRUE, IF(IF(ISBLANK(K' + r + '), TODAY(), K' + r + ')<=I' + r + ', "🟢 Đúng hạn", "🔴 Trễ hạn"), IF(ISBLANK(I' + r + '), "⚪ Chưa có hạn", IF(I' + r + '-TODAY()<0, "🔴 Quá hạn", IF(I' + r + '-TODAY()<=2, "🟠 Sắp đến hạn", "🟢 Đúng hạn"))))'
    ]);
  }
  sheet.getRange(15, 13, sampleFormulas.length, 3).setFormulas(sampleFormulas);
  
  sheet.setColumnWidth(1, 45);  // STT
  sheet.setColumnWidth(2, 140); // Dự án
  sheet.setColumnWidth(3, 220); // Tên công việc
  sheet.setColumnWidth(4, 180); // Số hồ sơ
  sheet.setColumnWidth(8, 110); // Bắt đầu
  sheet.setColumnWidth(9, 110); // Kết thúc
  sheet.setColumnWidth(13, 130); // Số ngày thực hiện
  sheet.setColumnWidth(14, 130); // Số ngày còn lại
  sheet.setColumnWidth(15, 150); // Trạng thái
  
  SpreadsheetApp.getUi().alert("Khởi tạo Sheet Checklist thành công!");
}

/**
 * 2. HÀM NHẬP DỮ LIỆU TỪ SHEET 'IMPORT' SANG SHEET 'CHECKLIST'
 * - Số hồ sơ (Cột A sheet IMPORT)  -> Cột D (Số hồ sơ / Tên CV) sheet Checklist
 * - Ngày nhận (Cột C sheet IMPORT) -> Cột H (Bắt đầu) sheet Checklist
 * - Ngày trả (Cột D sheet IMPORT)  -> Cột I (Kết thúc) sheet Checklist
 */
function importFromImportSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var importSheet = ss.getSheetByName("IMPORT") || ss.getSheetByName("Import") || ss.getSheetByName("DANH_SACH_HO_SO");
  if (!importSheet) {
    SpreadsheetApp.getUi().alert("❌ Không tìm thấy trang 'IMPORT'!\\nVui lòng đảm bảo bạn có 1 sheet tên là 'IMPORT'.");
    return;
  }
  
  var checklistSheet = ss.getSheetByName("Checklist");
  if (!checklistSheet) {
    setupChecklistSheet();
    checklistSheet = ss.getSheetByName("Checklist");
  }
  
  var lastRow = importSheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert("⚠️ Trang IMPORT không có dữ liệu nào.");
    return;
  }
  
  // Đọc từ hàng 2 đến hết
  var importData = importSheet.getRange(2, 1, lastRow - 1, Math.max(4, importSheet.getLastColumn())).getValues();
  var startRow = 15;
  var count = 0;
  
  for (var i = 0; i < importData.length; i++) {
    var row = importData[i];
    var soHoSo = row[0];  // Cột A: Số hồ sơ
    var ngayNhan = row[2]; // Cột C: Ngày nhận
    var ngayTra = row[3];  // Cột D: Ngày trả
    
    if (!soHoSo && !ngayNhan && !ngayTra) continue;
    
    var r = startRow + count;
    
    checklistSheet.getRange(r, 1).setValue(count + 1); // Cột A: STT
    checklistSheet.getRange(r, 4).setValue(soHoSo);    // Cột D: Số hồ sơ
    
    if (ngayNhan) {
      checklistSheet.getRange(r, 8).setValue(new Date(ngayNhan)); // Cột H: Bắt đầu
    }
    if (ngayTra) {
      checklistSheet.getRange(r, 9).setValue(new Date(ngayTra));  // Cột I: Kết thúc
    }
    
    // Checkbox Tiến độ Tick (Cột J)
    checklistSheet.getRange(r, 10).insertCheckboxes();
    checklistSheet.getRange(r, 10).setValue(false);
    
    // Công thức Cột M, N, O
    var fM = '=IF(OR(ISBLANK(H' + r + '), ISBLANK(I' + r + ')), "", IF(J' + r + '=TRUE, IF(ISBLANK(K' + r + '), I' + r + '-H' + r + '+1, K' + r + '-H' + r + '+1), I' + r + '-H' + r + '+1))';
    var fN = '=IF(J' + r + '=TRUE, "Đã xong", IF(ISBLANK(I' + r + '), "", I' + r + '-TODAY()))';
    var fO = '=IF(J' + r + '=TRUE, IF(IF(ISBLANK(K' + r + '), TODAY(), K' + r + ')<=I' + r + ', "🟢 Đúng hạn", "🔴 Trễ hạn"), IF(ISBLANK(I' + r + '), "⚪ Chưa có hạn", IF(I' + r + '-TODAY()<0, "🔴 Quá hạn", IF(I' + r + '-TODAY()<=2, "🟠 Sắp đến hạn", "🟢 Đúng hạn"))))';
    
    checklistSheet.getRange(r, 13).setFormula(fM);
    checklistSheet.getRange(r, 14).setFormula(fN);
    checklistSheet.getRange(r, 15).setFormula(fO);
    
    count++;
  }
  
  checklistSheet.getRange(15, 8, Math.max(1, count), 2).setNumberFormat("dd/MM/yyyy").setHorizontalAlignment("center");
  
  SpreadsheetApp.getUi().alert("✅ Đã nhập thành công " + count + " hồ sơ từ sheet IMPORT sang trang Checklist!");
}

/**
 * 3. TỰ ĐỘNG LẤY NGÀY HOÀN THÀNH KHI TÍCH CHỌN TICK
 */
function onEdit(e) {
  if (!e) return;
  var sheet = e.range.getSheet();
  if (sheet.getName() !== "Checklist") return;
  
  var row = e.range.getRow();
  var col = e.range.getColumn();
  
  if (row < 15) return;
  
  if (col === 10) { // Cột J: Tick
    var checked = sheet.getRange(row, 10).getValue();
    var cellDoneDate = sheet.getRange(row, 11); // Cột K: Ngày hoàn thành
    
    if (checked === true) {
      cellDoneDate.setValue(new Date());
    } else {
      cellDoneDate.clearContent();
    }
  }
}

/**
 * 4. WEB APP 2 CHIỀU: POST TỪ APP ĐỂ ĐỒNG BỘ LÊN SHEET
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === 'syncTasks' && data.tasks) {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("Checklist");
      if (!sheet) {
        setupChecklistSheet();
        sheet = ss.getSheetByName("Checklist");
      }
      
      var startRow = 15;
      
      // Xóa hoàn toàn dữ liệu cũ (Tất cả 15 cột bao gồm Checkbox và Công thức)
      var lastRow = Math.max(14, sheet.getLastRow());
      if (lastRow > 14) {
        var clearRange = sheet.getRange(startRow, 1, lastRow - 14, 15);
        clearRange.clearContent();
        clearRange.removeCheckboxes();
      }
      
      // Update new data
      var tasks = data.tasks;
      for (var i = 0; i < tasks.length; i++) {
        var t = tasks[i];
        var r = startRow + i;
        
        sheet.getRange(r, 1).setValue(i + 1); // STT
        sheet.getRange(r, 3).setValue(t.taskName || ""); // Tên công việc
        sheet.getRange(r, 4).setValue(t.project || ""); // Số hồ sơ
        sheet.getRange(r, 5).setValue(t.priority || ""); // Cấp độ
        sheet.getRange(r, 8).setValue(t.startDate ? new Date(t.startDate) : "");
        sheet.getRange(r, 9).setValue(t.endDate ? new Date(t.endDate) : "");
        
        // Tạo lại Checkbox Tiến độ Tick (Cột J)
        sheet.getRange(r, 10).insertCheckboxes();
        sheet.getRange(r, 10).setValue(t.completed);
        
        if (t.completed && t.completionDate) {
          sheet.getRange(r, 11).setValue(new Date(t.completionDate));
        }

        // Tạo lại công thức Cột M, N, O
        var fM = '=IF(OR(ISBLANK(H' + r + '), ISBLANK(I' + r + ')), "", IF(J' + r + '=TRUE, IF(ISBLANK(K' + r + '), I' + r + '-H' + r + '+1, K' + r + '-H' + r + '+1), I' + r + '-H' + r + '+1))';
        var fN = '=IF(J' + r + '=TRUE, "Đã xong", IF(ISBLANK(I' + r + '), "", I' + r + '-TODAY()))';
        var fO = '=IF(J' + r + '=TRUE, IF(IF(ISBLANK(K' + r + '), TODAY(), K' + r + ')<=I' + r + ', "🟢 Đúng hạn", "🔴 Trễ hạn"), IF(ISBLANK(I' + r + '), "⚪ Chưa có hạn", IF(I' + r + '-TODAY()<0, "🔴 Quá hạn", IF(I' + r + '-TODAY()<=2, "🟠 Sắp đến hạn", "🟢 Đúng hạn"))))';
        
        sheet.getRange(r, 13).setFormula(fM);
        sheet.getRange(r, 14).setFormula(fN);
        sheet.getRange(r, 15).setFormula(fO);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Đã đồng bộ " + tasks.length + " hồ sơ thành công"
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 5. WEB APP 2 CHIỀU: GET TỪ SHEET ĐỂ ĐỒNG BỘ VỀ APP
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Checklist");
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Không tìm thấy Sheet Checklist" })).setMimeType(ContentService.MimeType.JSON);
    
    var lastRow = sheet.getLastRow();
    var data = [];
    if (lastRow >= 15) {
      data = sheet.getRange(15, 1, lastRow - 14, 11).getValues();
    }
    
    var tasks = data.map(function(row, index) {
      if (!row[2] && !row[3]) return null;
      return {
        id: "sheet-" + index,
        stt: row[0] || index + 1,
        taskName: row[2] || "",
        project: row[3] || "",
        handler: "Cán bộ từ Sheet",
        priority: row[4] || "Trung bình",
        startDate: row[7] ? Utilities.formatDate(new Date(row[7]), Session.getScriptTimeZone(), "yyyy-MM-dd") : "",
        endDate: row[8] ? Utilities.formatDate(new Date(row[8]), Session.getScriptTimeZone(), "yyyy-MM-dd") : "",
        completed: row[9] === true,
        completionDate: row[10] ? Utilities.formatDate(new Date(row[10]), Session.getScriptTimeZone(), "yyyy-MM-dd") : ""
      };
    }).filter(Boolean);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      tasks: tasks
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sampleAppsScript);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0f4c4a] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            <h2 className="text-lg font-bold">Tự Động Cập Nhật Google Sheets</h2>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'sync'
                ? 'border-emerald-700 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Đồng Bộ Tự Động
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'script'
                ? 'border-emerald-700 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Mã Google Apps Script Mẫu
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'sync' ? (
            <div className="space-y-4 text-xs">
              {/* Auto Sync Toggle */}
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Chế độ Tự động Đồng bộ Dữ liệu
                  </h4>
                  <p className="text-slate-600 mt-1">
                    Mọi thay đổi (thêm, sửa, xóa, hoàn thành) sẽ tự động cập nhật lên Google Sheets.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoSyncEnabled}
                    onChange={(e) => setConfig((prev) => ({ ...prev, autoSyncEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Spreadsheet ID / URL */}
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Spreadsheet ID / URL Link Google Sheet:</label>
                  <input
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/1ABC... hoặc ID"
                    value={config.spreadsheetUrl || config.spreadsheetId}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      let id = val;
                      const match = val.match(/\/d\/([a-zA-Z0-9-_]+)/);
                      if (match) id = match[1];
                      setConfig((prev) => ({ ...prev, spreadsheetId: id, spreadsheetUrl: val }));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên Sheet trong Tệp Google Sheet:</label>
                  <input
                    type="text"
                    value={config.sheetName}
                    onChange={(e) => setConfig((prev) => ({ ...prev, sheetName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    URL Google Apps Script WebApp (Để đồng bộ 2 chiều):
                  </label>
                  <input
                    type="text"
                    placeholder="https://script.google.com/macros/s/AKfyc.../exec"
                    value={config.webAppUrl || ''}
                    onChange={(e) => setConfig((prev) => ({ ...prev, webAppUrl: e.target.value.trim() }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-[11px]"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Copy URL sau khi Triển khai (Deploy as Web App) đoạn mã bên Tab "Mã Google Apps Script Mẫu".</p>
                </div>
              </div>

              {/* Last Sync Info */}
              {config.lastSyncedAt && (
                <p className="text-slate-500 italic text-[11px]">
                  Lần đồng bộ gần nhất: {config.lastSyncedAt}
                </p>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                {config.spreadsheetUrl && (
                  <a
                    href={config.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg font-bold transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Mở Google Sheet trên tab mới
                  </a>
                )}
                
                <div className="flex gap-2 ml-auto">
                  {config.webAppUrl && (
                    <button
                      type="button"
                      onClick={handlePull}
                      disabled={isPulling}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition cursor-pointer flex items-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isPulling ? 'animate-spin' : ''}`} />
                      {isPulling ? 'Đang lấy dữ liệu...' : 'Lấy dữ liệu từ Sheet'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onTriggerSyncNow}
                    disabled={isSyncing}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow transition cursor-pointer flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Đang xuất dữ liệu...' : `Đồng bộ ${tasks.length} task ngay`}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-amber-950">
                  ⚡ Hướng dẫn sửa Lỗi Phân tích Cú pháp (#ERROR!) & Quy tắc Trạng thái:
                </p>
                <p className="text-[11px] text-amber-900">
                  • <b>Khi tích hoàn thành (Tick):</b> Ngày hoàn thành tự động điền, Trạng thái chuyển thành <span className="font-bold text-emerald-700">🟢 Đúng hạn</span> (nếu xong trước/đúng hạn) hoặc <span className="font-bold text-rose-700">🔴 Trễ hạn</span> (nếu xong sau deadline).
                </p>
                <p className="text-[11px] text-amber-900">
                  • <b>Dành cho Google Sheets Tiếng Việt:</b> Dùng dấu chấm phẩy <code className="font-bold text-rose-700 font-mono bg-amber-100 px-1 rounded">;</code> ngăn cách các tham số:
                </p>
                <div className="bg-white p-2 rounded border border-amber-200 font-mono text-[11px] space-y-1 text-slate-900 overflow-x-auto">
                  <p><b>Cột K (Ngày hoàn thành):</b> <code className="text-emerald-800">{`=IF(J15=TRUE; TODAY(); "")`}</code> <span className="text-[10px] text-slate-500 font-sans italic">(Tự điền ngày hôm nay khi tích chọn)</span></p>
                  <p><b>Cột M (Số ngày thực hiện):</b> <code className="text-emerald-800">{`=IF(OR(ISBLANK(H15); ISBLANK(I15)); ""; IF(J15=TRUE; IF(ISBLANK(K15); I15-H15+1; K15-H15+1); I15-H15+1))`}</code></p>
                  <p><b>Cột N (Số ngày còn lại):</b> <code className="text-emerald-800">{`=IF(J15=TRUE; "Đã xong"; IF(ISBLANK(I15); ""; I15-TODAY()))`}</code></p>
                  <p><b>Cột O (Trạng thái):</b> <code className="text-emerald-800">{`=IF(J15=TRUE; IF(IF(ISBLANK(K15); TODAY(); K15)<=I15; "🟢 Đúng hạn"; "🔴 Trễ hạn"); IF(ISBLANK(I15); "⚪ Chưa có hạn"; IF(I15-TODAY()<0; "🔴 Quá hạn"; IF(I15-TODAY()<=2; "🟠 Sắp đến hạn"; "🟢 Đúng hạn"))))`}</code></p>
                </div>
                <p className="text-[10px] text-amber-800 italic">
                  * Ghi chú: Nếu dùng Apps Script (<code className="font-mono bg-amber-100 px-1 rounded">setupChecklistSheet</code>), mã sẽ tự động chọn dấu ngăn cách phù hợp với ngôn ngữ Google Sheet của bạn.
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-800">
                  Mã Google Apps Script tự động khởi tạo & sửa lỗi công thức:
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-300 transition cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Đã sao chép' : 'Sao chép mã'}
                </button>
              </div>

              <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-60 border border-slate-800">
                {sampleAppsScript}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 flex items-center justify-end border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
