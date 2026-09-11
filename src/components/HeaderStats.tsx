import React from 'react';
import { Task } from '../types';
import { calculateTaskMetrics } from '../utils/dateUtils';
import { AlertTriangle, Clock, CheckCircle2, ShieldAlert, FileSpreadsheet, Bell, Plus, Download } from 'lucide-react';

interface HeaderStatsProps {
  tasks: Task[];
  onOpenNewTaskModal: () => void;
  onOpenImportModal: () => void;
  onOpenGoogleSheetModal: () => void;
  onOpenNotificationsModal: () => void;
  unreadNotificationsCount: number;
  autoSyncEnabled: boolean;
}

export const HeaderStats: React.FC<HeaderStatsProps> = ({
  tasks,
  onOpenNewTaskModal,
  onOpenImportModal,
  onOpenGoogleSheetModal,
  onOpenNotificationsModal,
  unreadNotificationsCount,
  autoSyncEnabled,
}) => {
  // Calculate summary statistics
  let taskPhaiLam = 0;   // Pending / Active
  let taskDenHan = 0;    // 1, 2 days or today left
  let taskQuaHan = 0;    // Overdue
  let taskHoanThanh = 0; // Completed

  tasks.forEach((task) => {
    const metrics = calculateTaskMetrics(task);
    if (task.completed) {
      taskHoanThanh++;
    } else if (task.dropped) {
      // Stopped
    } else {
      taskPhaiLam++;
      if (metrics.status === 'OVERDUE') {
        taskQuaHan++;
      } else if (metrics.status === 'DUE_SOON_1' || metrics.status === 'DUE_SOON_2') {
        taskDenHan++;
      }
    }
  });

  return (
    <div className="bg-[#0f4c4a] text-white rounded-xl p-5 shadow-lg mb-6 border border-[#1a6462]">
      {/* Title & Top Sync Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1b6b68]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-emerald-100">Check - List Công Việc & Quản Lý Hồ Sơ</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-800 text-emerald-200 border border-emerald-600">
              Auto Sync
            </span>
          </div>
          <p className="text-xs text-emerald-200/80 mt-0.5">
            Tự động cập nhật dữ liệu • Tô màu hạn xử lý • Phân công cán bộ
          </p>
        </div>

        {/* Action Button Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenNewTaskModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo task mới
          </button>

          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#19615e] hover:bg-[#207572] text-white text-xs font-medium border border-emerald-600/40 shadow transition cursor-pointer"
            title="Import tiếp nối dữ liệu (Không đè lên dữ liệu gốc)"
          >
            <Download className="w-4 h-4 text-emerald-300" />
            Import dữ liệu
          </button>

          <button
            onClick={onOpenGoogleSheetModal}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium shadow border transition cursor-pointer ${
              autoSyncEnabled
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-[#19615e] text-emerald-100 border-emerald-600/40 hover:bg-[#207572]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            {autoSyncEnabled ? 'Sheets: Đang kết nối' : 'Đồng bộ Google Sheets'}
          </button>

          <button
            onClick={onOpenNotificationsModal}
            className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#19615e] hover:bg-[#207572] text-emerald-100 text-xs font-medium border border-emerald-600/40 shadow transition cursor-pointer"
          >
            <Bell className="w-4 h-4 text-amber-300" />
            Nhắc nhở
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-full animate-bounce">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Dashboard Stat Grid - Matches dark teal design style from sample image */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-4">
        {/* Task phải làm */}
        <div className="bg-[#155956] p-3.5 rounded-lg border border-[#217370] flex items-center justify-between shadow-inner">
          <div>
            <p className="text-xs text-emerald-200 font-medium">Task phải làm</p>
            <p className="text-2xl font-extrabold text-white mt-1">{taskPhaiLam}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-800/60 border border-emerald-600/40 flex items-center justify-center text-emerald-300">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Task đến hạn (1-2 ngày) - CAM */}
        <div className="bg-[#155956] p-3.5 rounded-lg border border-amber-500/60 flex items-center justify-between shadow-inner relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500" />
          <div>
            <p className="text-xs text-amber-200 font-medium flex items-center gap-1">
              Task đến hạn (1-2 ngày)
            </p>
            <p className="text-2xl font-extrabold text-amber-300 mt-1">{taskDenHan}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Task quá hạn - ĐỎ */}
        <div className="bg-[#155956] p-3.5 rounded-lg border border-rose-500/60 flex items-center justify-between shadow-inner relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-rose-500" />
          <div>
            <p className="text-xs text-rose-200 font-medium">Task quá hạn</p>
            <p className="text-2xl font-extrabold text-rose-300 mt-1">{taskQuaHan}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Task hoàn thành */}
        <div className="bg-[#155956] p-3.5 rounded-lg border border-[#217370] flex items-center justify-between shadow-inner">
          <div>
            <p className="text-xs text-emerald-200 font-medium">Task hoàn thành</p>
            <p className="text-2xl font-extrabold text-emerald-300 mt-1">{taskHoanThanh}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
