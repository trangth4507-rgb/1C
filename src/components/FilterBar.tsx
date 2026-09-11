import React from 'react';
import { FilterState } from '../types';
import { Search, Filter, RotateCcw, User, FolderKanban, ShieldAlert } from 'lucide-react';

interface FilterBarProps {
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  handlersList: string[];
  projectsList: string[];
  totalResults: number;
  totalTasks: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterState,
  setFilterState,
  handlersList,
  projectsList,
  totalResults,
  totalTasks,
}) => {
  const handleReset = () => {
    setFilterState({
      searchQuery: '',
      statusFilter: 'ALL',
      handlerFilter: 'ALL',
      projectFilter: 'ALL',
      priorityFilter: 'ALL',
    });
  };

  const statusOptions = [
    { id: 'ALL', label: 'Tất cả trạng thái' },
    { id: 'DUE_SOON', label: '🟠 Đến hạn (1-2 ngày)' },
    { id: 'OVERDUE', label: '🔴 Quá hạn' },
    { id: 'ON_TIME', label: '🟢 Đúng hạn' },
    { id: 'COMPLETED', label: '☑️ Hoàn thành' },
    { id: 'STOPPED', label: '⛔ Dừng' },
  ] as const;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6 space-y-4">
      {/* Top Search & Reset */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Rapid Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhanh theo số hồ sơ, tên công việc, cán bộ xử lý, ghi chú..."
            value={filterState.searchQuery}
            onChange={(e) => setFilterState((prev) => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
          {filterState.searchQuery && (
            <button
              onClick={() => setFilterState((prev) => ({ ...prev, searchQuery: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full px-1.5 py-0.5"
            >
              ✕
            </button>
          )}
        </div>

        {/* Total Badge & Reset button */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-600 font-medium px-3 py-2 bg-slate-100 rounded-lg border border-slate-200 whitespace-nowrap">
            Hiển thị: <span className="font-bold text-emerald-700">{totalResults}</span> / {totalTasks} hồ sơ
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-200 cursor-pointer"
            title="Đặt lại bộ lọc"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Đặt lại
          </button>
        </div>
      </div>

      {/* Filter Tabs & Dropdowns */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          {statusOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilterState((prev) => ({ ...prev, statusFilter: opt.id }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                filterState.statusFilter === opt.id
                  ? 'bg-emerald-700 text-white shadow-sm font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-slate-200 mx-1 hidden lg:block" />

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Cán bộ xử lý */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterState.handlerFilter}
              onChange={(e) => setFilterState((prev) => ({ ...prev, handlerFilter: e.target.value }))}
              className="bg-transparent text-slate-700 focus:outline-none pr-1 cursor-pointer"
            >
              <option value="ALL">Tất cả cán bộ xử lý</option>
              {handlersList.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Dự án / Hồ sơ */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1">
            <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterState.projectFilter}
              onChange={(e) => setFilterState((prev) => ({ ...prev, projectFilter: e.target.value }))}
              className="bg-transparent text-slate-700 focus:outline-none pr-1 cursor-pointer max-w-[160px] truncate"
            >
              <option value="ALL">Tất cả hồ sơ / dự án</option>
              {projectsList.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Cấp độ / Ưu tiên */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterState.priorityFilter}
              onChange={(e) => setFilterState((prev) => ({ ...prev, priorityFilter: e.target.value }))}
              className="bg-transparent text-slate-700 focus:outline-none pr-1 cursor-pointer"
            >
              <option value="ALL">Tất cả cấp độ</option>
              <option value="Cao">Cao</option>
              <option value="Trung bình">Trung bình</option>
              <option value="Thấp">Thấp</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
