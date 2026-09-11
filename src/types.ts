export type TaskStatus =
  | 'ON_TIME'       // 🟢 Đúng hạn (>= 3 ngày)
  | 'DUE_SOON_2'    // 🟠 Còn 2 ngày (tô màu cam)
  | 'DUE_SOON_1'    // 🟠 Còn 1 ngày (tô màu cam)
  | 'OVERDUE'       // 🔴 Quá hạn (tô màu đỏ)
  | 'COMPLETED'     // ☑️ Hoàn thành
  | 'STOPPED';      // ⛔ Dừng

export type TaskPriority = 'Cao' | 'Trung bình' | 'Thấp';

export interface Task {
  id: string;
  stt: number;
  project: string;         // Số hồ sơ / Dự án (vd: 31481.G/2026/04507)
  taskName: string;        // Tên công việc
  handler: string;         // Cán bộ xử lý (vd: Trần Hà Trang)
  priority: TaskPriority;  // Cấp độ
  startDate: string;       // Ngày bắt đầu (YYYY-MM-DD)
  endDate: string;         // Ngày kết thúc / Deadline (YYYY-MM-DD)
  completed: boolean;      // Đã hoàn thành (Tick)
  completionDate?: string; // Ngày hoàn thành
  dropped?: boolean;       // Dừng công việc
  files?: string;          // Đường dẫn / thông tin Files
  notes?: string;          // Ghi chú
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskComputedMetrics {
  durationDays: number;   // Số ngày thực hiện = endDate - startDate + 1
  daysRemaining: number;  // Số ngày còn lại = endDate - today
  status: TaskStatus;     // Trạng thái tính toán
  statusLabel: string;    // Chuỗi hiển thị (vd: 🟠 Còn 2 ngày)
  statusColor: string;    // Mã màu CSS / Class
}

export interface FilterState {
  searchQuery: string;
  statusFilter: 'ALL' | 'DUE_SOON' | 'OVERDUE' | 'ON_TIME' | 'COMPLETED' | 'STOPPED';
  handlerFilter: string;
  projectFilter: string;
  priorityFilter: string;
}

export interface ImportRawRow {
  soHoSo?: string;
  canBoXuLy?: string;
  ngayNhan?: string;
  ngayTra?: string;
  tenCongViec?: string;
  capDo?: string;
  files?: string;
  [key: string]: any;
}

export interface GoogleSheetConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetName: string;
  autoSyncEnabled: boolean;
  lastSyncedAt?: string;
  webAppUrl?: string; // WebApp URL from Apps Script for 2-way sync
}

export interface SystemNotification {
  id: string;
  taskId: string;
  title: string;
  message: string;
  type: 'DUE_SOON' | 'OVERDUE' | 'INFO';
  createdAt: string;
  read: boolean;
}
