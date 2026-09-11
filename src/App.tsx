import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Task, FilterState, GoogleSheetConfig, SystemNotification } from './types';
import { INITIAL_TASKS } from './utils/sampleData';
import { calculateTaskMetrics, formatDisplayDate, getTodayIsoDate } from './utils/dateUtils';
import { HeaderStats } from './components/HeaderStats';
import { FilterBar } from './components/FilterBar';
import { TaskTable } from './components/TaskTable';
import { TaskModal } from './components/TaskModal';
import { ImportModal } from './components/ImportModal';
import { NotificationModal } from './components/NotificationModal';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { Download, Sparkles, AlertCircle, FileSpreadsheet, LogOut, LogIn } from 'lucide-react';

import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { collection, query, onSnapshot, setDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';

const SHEET_CONFIG_KEY = 'CHECKLIST_APP_SHEET_CONFIG_V1';

export default function App() {
  // Load initial tasks from LocalStorage or default sample data
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('CHECKLIST_APP_TASKS_V1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading tasks from localStorage', e);
    }
    return INITIAL_TASKS;
  });

  const [user, setUser] = useState<User | null>(null);
  
  // Load Google Sheet Config
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig>(() => {
    try {
      const saved = localStorage.getItem(SHEET_CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      spreadsheetId: '',
      spreadsheetUrl: '',
      sheetName: 'Checklist',
      autoSyncEnabled: false,
      webAppUrl: '',
    };
  });

  // Filter State
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    statusFilter: 'ALL',
    handlerFilter: 'ALL',
    projectFilter: 'ALL',
    priorityFilter: 'ALL',
  });

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Web Notification Permission
  const [webPermissionStatus, setWebPermissionStatus] = useState<NotificationPermission | 'unsupported'>(() => {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Save tasks to LocalStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem('CHECKLIST_APP_TASKS_V1', JSON.stringify(tasks));
    } catch (e) {
      console.error('Error saving tasks', e);
    }
  }, [tasks]);

  // Save Sheet Config
  useEffect(() => {
    try {
      localStorage.setItem(SHEET_CONFIG_KEY, JSON.stringify(sheetConfig));
    } catch (e) {}
  }, [sheetConfig]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Generate Notifications based on task status
  const notifications = useMemo<SystemNotification[]>(() => {
    const list: SystemNotification[] = [];
    const today = getTodayIsoDate();

    tasks.forEach((task) => {
      if (task.completed || task.dropped) return;
      const metrics = calculateTaskMetrics(task, today);

      if (metrics.status === 'OVERDUE') {
        list.push({
          id: `notif-overdue-${task.id}`,
          taskId: task.id,
          title: `🔴 QUÁ HẠN: Hồ sơ ${task.project}`,
          message: `Công việc "${task.taskName}" do cán bộ ${task.handler} xử lý đã quá hạn (${Math.abs(metrics.daysRemaining)} ngày).`,
          type: 'OVERDUE',
          createdAt: 'Vừa xong',
          read: false,
        });
      } else if (metrics.status === 'DUE_SOON_1' || metrics.status === 'DUE_SOON_2') {
        list.push({
          id: `notif-soon-${task.id}`,
          taskId: task.id,
          title: `🟠 SẮP ĐẾN HẠN: Hồ sơ ${task.project}`,
          message: `Công việc "${task.taskName}" (Cán bộ: ${task.handler}) còn ${metrics.daysRemaining} ngày để hoàn thành.`,
          type: 'DUE_SOON',
          createdAt: 'Vừa xong',
          read: false,
        });
      }
    });

    return list;
  }, [tasks]);

  // Handle Web Notification Trigger
  const handleRequestWebPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        setWebPermissionStatus(permission);
        if (permission === 'granted') {
          new Notification('Checklist Management', {
            body: 'Đã kích hoạt thông báo nhắc nhở hạn xử lý hồ sơ thành công!',
          });
        }
      });
    }
  };

  // Sync to Backend / Google Sheets
  const triggerGoogleSheetSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks,
          spreadsheetId: sheetConfig.spreadsheetId,
          sheetName: sheetConfig.sheetName,
          webAppUrl: sheetConfig.webAppUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSheetConfig((prev) => ({
          ...prev,
          lastSyncedAt: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
        }));
        showToast('Đã đồng bộ thành công dữ liệu lên Google Sheets!');
      }
    } catch (err) {
      console.error('Sync failed', err);
      showToast('Đã cập nhật dữ liệu bộ nhớ cục bộ.');
    } finally {
      setIsSyncing(false);
    }
  };

  const triggerGoogleSheetPull = async () => {
    if (!sheetConfig.webAppUrl) {
      showToast('Vui lòng nhập WebApp URL để lấy dữ liệu.');
      return;
    }
    
    try {
      const res = await fetch(`/api/sheets/sync?webAppUrl=${encodeURIComponent(sheetConfig.webAppUrl)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.tasks)) {
        setTasks(data.tasks as Task[]);
        setSheetConfig((prev) => ({
          ...prev,
          lastSyncedAt: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
        }));
        showToast(`Đã lấy thành công ${data.tasks.length} hồ sơ từ Google Sheet!`);
      } else {
        showToast(data.error || 'Lấy dữ liệu thất bại.');
      }
    } catch (err) {
      console.error('Pull failed', err);
      showToast('Lỗi kết nối khi lấy dữ liệu từ Google Sheet.');
    }
  };

  // Auto Sync trigger on task mutation if enabled
  const triggerAutoSyncIfEnabled = () => {
    if (sheetConfig.autoSyncEnabled) {
      triggerGoogleSheetSync();
    }
  };

  // List of unique handlers & projects for filter dropdowns
  const handlersList = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.handler && set.add(t.handler));
    return Array.from(set).sort();
  }, [tasks]);

  const projectsList = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.project && set.add(t.project));
    return Array.from(set).sort();
  }, [tasks]);

  // Filter & Search Logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const metrics = calculateTaskMetrics(task);

      // Search Query
      if (filterState.searchQuery) {
        const q = filterState.searchQuery.toLowerCase();
        const matchProject = task.project.toLowerCase().includes(q);
        const matchName = task.taskName.toLowerCase().includes(q);
        const matchHandler = task.handler.toLowerCase().includes(q);
        const matchNotes = (task.notes || '').toLowerCase().includes(q);
        if (!matchProject && !matchName && !matchHandler && !matchNotes) {
          return false;
        }
      }

      // Status Filter
      if (filterState.statusFilter === 'DUE_SOON') {
        if (metrics.status !== 'DUE_SOON_1' && metrics.status !== 'DUE_SOON_2') return false;
      } else if (filterState.statusFilter === 'OVERDUE') {
        if (metrics.status !== 'OVERDUE') return false;
      } else if (filterState.statusFilter === 'ON_TIME') {
        if (metrics.status !== 'ON_TIME') return false;
      } else if (filterState.statusFilter === 'COMPLETED') {
        if (!task.completed) return false;
      } else if (filterState.statusFilter === 'STOPPED') {
        if (!task.dropped) return false;
      }

      // Handler Filter
      if (filterState.handlerFilter !== 'ALL' && task.handler !== filterState.handlerFilter) {
        return false;
      }

      // Project Filter
      if (filterState.projectFilter !== 'ALL' && task.project !== filterState.projectFilter) {
        return false;
      }

      // Priority Filter
      if (filterState.priorityFilter !== 'ALL' && task.priority !== filterState.priorityFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, filterState]);

  // Task Actions
  const handleCreateOrUpdateTask = (taskData: Omit<Task, 'id' | 'stt'> & { id?: string }) => {
    if (taskData.id) {
      // Update existing
      setTasks((prev) =>
        prev.map((t) => (t.id === taskData.id ? ({ ...t, ...taskData } as Task) : t))
      );
      showToast('Đã cập nhật thông tin hồ sơ thành công!');
    } else {
      // Create new
      const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}`,
        stt: tasks.length + 1,
      };
      setTasks((prev) => [...prev, newTask]);
      showToast('Đã thêm hồ sơ công việc mới!');
    }
    triggerAutoSyncIfEnabled();
  };

  const handleToggleComplete = (taskId: string) => {
    const today = getTodayIsoDate();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextCompleted = !t.completed;
          return {
            ...t,
            completed: nextCompleted,
            completionDate: nextCompleted ? today : undefined,
          };
        }
        return t;
      })
    );
    showToast('Đã cập nhật tiến độ công việc!');
    triggerAutoSyncIfEnabled();
  };

  const handleToggleDropped = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, dropped: !t.dropped } : t))
    );
    showToast('Đã thay đổi trạng thái tạm dừng công việc!');
    triggerAutoSyncIfEnabled();
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa hồ sơ công việc này?')) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      showToast('Đã xóa công việc khỏi danh sách!');
      triggerAutoSyncIfEnabled();
    }
  };

  // Import Handler (APPEND MODE - APPENDS NEW ROWS BELOW EXISTING DATA)
  const handleImportAppend = (newTasksData: Omit<Task, 'id' | 'stt'>[]) => {
    const startingStt = tasks.length + 1;
    const formattedNewTasks: Task[] = newTasksData.map((data, index) => ({
      ...data,
      id: `imported-${Date.now()}-${index}`,
      stt: startingStt + index,
    }));

    setTasks((prev) => [...prev, ...formattedNewTasks]);
    showToast(`Đã import thành công ${newTasksData.length} hồ sơ mới nối tiếp vào danh sách!`);
    triggerAutoSyncIfEnabled();
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const exportRows = filteredTasks.map((t, idx) => {
      const metrics = calculateTaskMetrics(t);
      return {
        'STT': idx + 1,
        'Số hồ sơ / Dự án': t.project,
        'Tên công việc': t.taskName,
        'Cán bộ xử lý': t.handler,
        'Cấp độ': t.priority,
        'Bắt đầu': formatDisplayDate(t.startDate),
        'Kết thúc (Deadline)': formatDisplayDate(t.endDate),
        'Tiến độ': t.completed ? 'Đã xong' : 'Đang làm',
        'Ngày hoàn thành': t.completed ? formatDisplayDate(t.completionDate) : '',
        'Số ngày thực hiện': metrics.durationDays,
        'Số ngày còn lại': metrics.daysRemaining,
        'Trạng thái': metrics.statusLabel,
        'Ghi chú': t.notes || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Checklist');
    XLSX.writeFile(workbook, `Checklist_CongViec_${getTodayIsoDate()}.xlsx`);
    showToast('Đã tải xuống file Excel thành công!');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-3 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            {toastMessage}
          </div>
        )}

        {/* Auth Bar */}
        <div className="flex items-center justify-between bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Checklist Manager
            </h1>
          </div>
          <div>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-600">Xin chào, {user.displayName || user.email}</span>
                <button onClick={() => signOut(auth)} className="text-xs flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded hover:bg-rose-50 transition cursor-pointer">
                  <LogOut className="w-3.5 h-3.5" /> Đăng xuất
                </button>
              </div>
            ) : (
              <button onClick={() => signInWithPopup(auth, new GoogleAuthProvider())} className="text-xs flex items-center gap-1.5 text-white bg-blue-600 hover:bg-blue-700 font-semibold px-3 py-1.5 rounded-lg shadow-sm transition cursor-pointer">
                <LogIn className="w-3.5 h-3.5" /> Đăng nhập bằng Google
              </button>
            )}
          </div>
        </div>

        {/* Header Metric Summary Bar */}
        <HeaderStats
          tasks={tasks}
          onOpenNewTaskModal={() => {
            setEditingTask(null);
            setIsTaskModalOpen(true);
          }}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onOpenGoogleSheetModal={() => setIsGoogleSheetModalOpen(true)}
          onOpenNotificationsModal={() => setIsNotificationsModalOpen(true)}
          unreadNotificationsCount={notifications.length}
          autoSyncEnabled={sheetConfig.autoSyncEnabled}
        />

        {/* Filter and Quick Search Bar */}
        <FilterBar
          filterState={filterState}
          setFilterState={setFilterState}
          handlersList={handlersList}
          projectsList={projectsList}
          totalResults={filteredTasks.length}
          totalTasks={tasks.length}
        />

        {/* Export & Action Sub-Bar */}
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Quy tắc màu sắc:</span>
            <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 font-medium">
              🟠 Còn 1-2 ngày
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-100 border border-rose-300 text-rose-900 font-medium">
              🔴 Quá hạn
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-900 font-medium">
              🟢 Đúng hạn
            </span>
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold rounded-lg shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            Xuất file Excel
          </button>
        </div>

        {/* Main Task Data Table */}
        <TaskTable
          tasks={filteredTasks}
          onToggleComplete={handleToggleComplete}
          onToggleDropped={handleToggleDropped}
          onEditTask={(task) => {
            setEditingTask(task);
            setIsTaskModalOpen(true);
          }}
          onDeleteTask={handleDeleteTask}
        />

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 py-4 border-t border-slate-200">
          Hệ thống Quản lý Checklist Hồ sơ Công việc • Tự động cập nhật dữ liệu & Cảnh báo hạn xử lý
        </footer>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleCreateOrUpdateTask}
        initialTask={editingTask}
        existingHandlers={handlersList}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportAppend={handleImportAppend}
        currentTasksCount={tasks.length}
      />

      <NotificationModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => showToast('Đã đánh dấu đã đọc các thông báo')}
        onRequestWebPermission={handleRequestWebPermission}
        webPermissionStatus={webPermissionStatus}
      />

      <GoogleSheetModal
        isOpen={isGoogleSheetModalOpen}
        onClose={() => setIsGoogleSheetModalOpen(false)}
        config={sheetConfig}
        setConfig={setSheetConfig}
        tasks={tasks}
        onTriggerSyncNow={triggerGoogleSheetSync}
        onTriggerPull={triggerGoogleSheetPull}
        isSyncing={isSyncing}
      />
    </div>
  );
}
