import React, { useState, useEffect } from 'react';
import { Task, TaskPriority } from '../types';
import { COMMON_HANDLERS } from '../utils/sampleData';
import { getTodayIsoDate } from '../utils/dateUtils';
import { X, Save, Plus } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'stt'> & { id?: string }) => void;
  initialTask?: Task | null;
  existingHandlers: string[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  existingHandlers,
}) => {
  const [project, setProject] = useState('');
  const [taskName, setTaskName] = useState('');
  const [handler, setHandler] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Trung bình');
  const [startDate, setStartDate] = useState(getTodayIsoDate());
  const [endDate, setEndDate] = useState(getTodayIsoDate());
  const [files, setFiles] = useState('');
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setProject(initialTask.project || '');
      setTaskName(initialTask.taskName || '');
      setHandler(initialTask.handler || '');
      setPriority(initialTask.priority || 'Trung bình');
      setStartDate(initialTask.startDate || getTodayIsoDate());
      setEndDate(initialTask.endDate || getTodayIsoDate());
      setFiles(initialTask.files || '');
      setNotes(initialTask.notes || '');
      setCompleted(initialTask.completed || false);
    } else {
      setProject('');
      setTaskName('');
      setHandler(existingHandlers[0] || COMMON_HANDLERS[0]);
      setPriority('Trung bình');
      setStartDate(getTodayIsoDate());
      setEndDate(getTodayIsoDate());
      setFiles('');
      setNotes('');
      setCompleted(false);
    }
  }, [initialTask, isOpen, existingHandlers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim() || !project.trim()) return;

    onSave({
      id: initialTask?.id,
      project: project.trim(),
      taskName: taskName.trim(),
      handler: handler.trim() || 'Chưa phân công',
      priority,
      startDate,
      endDate,
      files: files.trim(),
      notes: notes.trim(),
      completed,
      completionDate: completed ? getTodayIsoDate() : undefined,
    });

    onClose();
  };

  const allHandlers = Array.from(new Set([...COMMON_HANDLERS, ...existingHandlers]));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#0f4c4a] text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {initialTask ? <Save className="w-5 h-5 text-emerald-300" /> : <Plus className="w-5 h-5 text-emerald-300" />}
            {initialTask ? 'Chỉnh Sửa Hồ Sơ / Công Việc' : 'Tạo Mới Hồ Sơ / Công Việc'}
          </h2>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Số hồ sơ / Dự án */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số Hồ Sơ / Dự Án <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="vd: 31481.G/2026/04507"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
              />
            </div>

            {/* Cán bộ xử lý */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cán Bộ Xử Lý <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-1">
                <input
                  type="text"
                  list="handlers-list"
                  placeholder="Chọn hoặc nhập tên cán bộ"
                  value={handler}
                  onChange={(e) => setHandler(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold text-teal-900 bg-teal-50/20"
                />
                <datalist id="handlers-list">
                  {allHandlers.map((h) => (
                    <option key={h} value={h} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Tên công việc */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên Công Việc <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="vd: Thẩm định hồ sơ đất đai & cấp GCN"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cấp độ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cấp Độ / Ưu Tiên</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              >
                <option value="Cao">Cao</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Thấp">Thấp</option>
              </select>
            </div>

            {/* Ngày Bắt Đầu */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ngày Bắt Đầu</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
              />
            </div>

            {/* Ngày Kết Thúc (Deadline) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hạn Trả (Deadline)</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Files / Tài liệu */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tệp Đính Kèm / Mã File</label>
              <input
                type="text"
                placeholder="vd: HoSo_31481.pdf"
                value={files}
                onChange={(e) => setFiles(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Công Việc</label>
              <input
                type="text"
                placeholder="Nội dung ghi chú ngắn..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* Complete Status */}
          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="modal-completed-check"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
            />
            <label htmlFor="modal-completed-check" className="text-xs font-semibold text-slate-800 cursor-pointer">
              Đánh dấu đã hoàn thành hồ sơ này
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow transition cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Lưu công việc
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
