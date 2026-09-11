import React from 'react';
import { Task } from '../types';
import { calculateTaskMetrics, formatDisplayDate } from '../utils/dateUtils';
import { Edit2, Trash2, Check, AlertCircle, Ban, Paperclip, CheckSquare, Square } from 'lucide-react';

interface TaskTableProps {
  tasks: Task[];
  currentDate: string;
  onToggleComplete: (taskId: string) => void;
  onToggleDropped: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  currentDate,
  onToggleComplete,
  onToggleDropped,
  onEditTask,
  onDeleteTask,
}) => {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-700">Không tìm thấy công việc nào</h3>
        <p className="text-xs text-slate-500 mt-1">
          Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-8">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          {/* Header styled matching the dark teal header in the sample image */}
          <thead>
            <tr className="bg-[#0f4c4a] text-white text-xs font-bold uppercase tracking-wider divide-x divide-[#1a6462]">
              <th className="py-3 px-3 text-center w-12">STT</th>
              <th className="py-3 px-3 min-w-[150px]">Số hồ sơ / Dự án</th>
              <th className="py-3 px-3 min-w-[220px]">Tên công việc</th>
              <th className="py-3 px-3 min-w-[150px] bg-[#125856]">Cán bộ xử lý</th>
              <th className="py-3 px-3 text-center w-24">Cấp độ</th>
              <th className="py-3 px-3 text-center min-w-[100px]">Bắt đầu</th>
              <th className="py-3 px-3 text-center min-w-[100px]">Kết thúc (DL)</th>
              <th className="py-3 px-3 text-center w-20">Tiến độ</th>
              <th className="py-3 px-3 text-center min-w-[110px]">Ngày xong</th>
              <th className="py-3 px-3 text-center w-24">Số ngày làm</th>
              <th className="py-3 px-3 text-center w-24">Số ngày còn</th>
              <th className="py-3 px-3 text-center min-w-[150px]">Trạng thái</th>
              <th className="py-3 px-3 text-center w-28">Thao tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 text-xs">
            {tasks.map((task, index) => {
              const metrics = calculateTaskMetrics(task, currentDate);

              // Determine row background color based on rules:
              // 1. Overdue -> RED ROW (Quá hạn -> Tô màu đỏ)
              // 2. 1 or 2 days left -> ORANGE ROW (Số ngày còn lại = 2 ngày, 1 ngày -> Tô màu cam)
              // 3. Completed -> Light blue row
              // 4. Stopped -> Neutral grey
              // 5. Default -> Alternating white/slate-50
              let rowBgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60';
              let borderAccentClass = 'border-l-4 border-l-transparent';

              if (task.completed) {
                rowBgClass = 'bg-emerald-50/40 text-slate-700';
              } else if (task.dropped) {
                rowBgClass = 'bg-slate-100/80 text-slate-500 line-through';
              } else if (metrics.status === 'OVERDUE') {
                rowBgClass = 'bg-rose-100/90 hover:bg-rose-100 text-rose-950 font-medium';
                borderAccentClass = 'border-l-4 border-l-rose-600';
              } else if (metrics.status === 'DUE_SOON_1' || metrics.status === 'DUE_SOON_2') {
                rowBgClass = 'bg-amber-100/90 hover:bg-amber-100 text-amber-950 font-medium';
                borderAccentClass = 'border-l-4 border-l-amber-500';
              }

              return (
                <tr
                  key={task.id}
                  className={`transition hover:bg-opacity-80 divide-x divide-slate-200/70 ${rowBgClass} ${borderAccentClass}`}
                >
                  {/* STT */}
                  <td className="py-3 px-3 text-center font-bold text-slate-600">
                    {index + 1}
                  </td>

                  {/* Số hồ sơ / Dự án */}
                  <td className="py-3 px-3 font-semibold text-slate-800 break-words">
                    {task.project}
                    {task.files && (
                      <span className="inline-flex items-center gap-0.5 ml-1.5 text-[10px] text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded" title={task.files}>
                        <Paperclip className="w-3 h-3" /> File
                      </span>
                    )}
                  </td>

                  {/* Tên công việc */}
                  <td className="py-3 px-3 font-medium text-slate-900 leading-snug">
                    {task.taskName}
                    {task.notes && (
                      <div className="text-[11px] text-slate-500 italic mt-0.5">
                        Ghi chú: {task.notes}
                      </div>
                    )}
                  </td>

                  {/* Cán bộ xử lý */}
                  <td className="py-3 px-3 font-semibold text-teal-900 bg-teal-50/30">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-600" />
                      {task.handler || 'Chưa phân công'}
                    </div>
                  </td>

                  {/* Cấp độ */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        task.priority === 'Cao'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : task.priority === 'Trung bình'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>

                  {/* Ngày Bắt đầu */}
                  <td className="py-3 px-3 text-center font-mono text-slate-700 whitespace-nowrap">
                    {formatDisplayDate(task.startDate)}
                  </td>

                  {/* Ngày Kết thúc (DL) */}
                  <td className="py-3 px-3 text-center font-mono font-semibold text-slate-900 whitespace-nowrap">
                    {formatDisplayDate(task.endDate)}
                  </td>

                  {/* Tiến độ (Tick Checkbox) */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onToggleComplete(task.id)}
                      className="p-1 rounded hover:bg-slate-200/60 transition cursor-pointer"
                      title={task.completed ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}
                    >
                      {task.completed ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600 mx-auto" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400 hover:text-slate-600 mx-auto" />
                      )}
                    </button>
                  </td>

                  {/* Ngày hoàn thành */}
                  <td className="py-3 px-3 text-center font-mono text-slate-600 whitespace-nowrap">
                    {task.completed ? formatDisplayDate(task.completionDate || task.endDate) : '—'}
                  </td>

                  {/* Số ngày thực hiện */}
                  <td className="py-3 px-3 text-center font-bold text-slate-700">
                    {metrics.durationDays} ngày
                  </td>

                  {/* Số ngày còn lại */}
                  <td className="py-3 px-3 text-center font-bold">
                    {task.completed ? (
                      <span className="text-slate-400">—</span>
                    ) : metrics.daysRemaining < 0 ? (
                      <span className="text-rose-700 font-black">{metrics.daysRemaining} ngày</span>
                    ) : metrics.daysRemaining <= 2 ? (
                      <span className="text-amber-900 font-black">{metrics.daysRemaining} ngày</span>
                    ) : (
                      <span className="text-emerald-700">{metrics.daysRemaining} ngày</span>
                    )}
                  </td>

                  {/* Trạng thái Badge */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-xs ${metrics.statusColor}`}
                    >
                      {metrics.statusLabel}
                    </span>
                  </td>

                  {/* Thao tác */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEditTask(task)}
                        className="p-1.5 rounded text-slate-600 hover:text-teal-700 hover:bg-slate-200/80 transition cursor-pointer"
                        title="Sửa công việc"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onToggleDropped(task.id)}
                        className={`p-1.5 rounded transition cursor-pointer ${
                          task.dropped
                            ? 'text-amber-600 hover:bg-amber-100'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/80'
                        }`}
                        title={task.dropped ? 'Kích hoạt lại task' : 'Tạm dừng task (Drop)'}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                        title="Xóa công việc"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
