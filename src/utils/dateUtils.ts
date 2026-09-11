import { Task, TaskComputedMetrics, TaskStatus } from '../types';

/**
 * Parses various date string formats (e.g., "05/08/2026", "05/08/2026 16:59", "2026-08-05")
 * into standard "YYYY-MM-DD".
 */
export function parseToIsoDate(input?: string | number | null): string {
  if (!input) return getTodayIsoDate();

  if (typeof input === 'number') {
    // Excel Serial Date Number
    const dateObj = new Date((input - (25567 + 2)) * 86400 * 1000);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
  }

  const str = String(input).trim();
  if (!str) return getTodayIsoDate();

  // Extract date part before time if space exists (e.g., "05/08/2026 16:59" -> "05/08/2026")
  const datePart = str.split(' ')[0];

  // DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(datePart)) {
    const [d, m, y] = datePart.split('/');
    const day = d.padStart(2, '0');
    const month = m.padStart(2, '0');
    return `${y}-${month}-${day}`;
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }

  // Try standard Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return getTodayIsoDate();
}

/**
 * Formats "YYYY-MM-DD" to "DD/MM/YYYY" for human display in Vietnamese format.
 */
export function formatDisplayDate(isoDate?: string | null): string {
  if (!isoDate) return '--/--/----';
  const clean = isoDate.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

/**
 * Returns today's ISO date (YYYY-MM-DD)
 */
export function getTodayIsoDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calculates day difference between two YYYY-MM-DD dates ignoring timezone hours.
 */
export function diffInDays(dateStrA: string, dateStrB: string): number {
  const [y1, m1, d1] = dateStrA.split('-').map(Number);
  const [y2, m2, d2] = dateStrB.split('-').map(Number);

  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((utc1 - utc2) / msPerDay);
}

/**
 * Calculates metrics for a given task:
 * - durationDays (End - Start + 1)
 * - daysRemaining (End - Today)
 * - status (ON_TIME, DUE_SOON_2, DUE_SOON_1, OVERDUE, COMPLETED, STOPPED)
 */
export function calculateTaskMetrics(task: Task, referenceToday: string = getTodayIsoDate()): TaskComputedMetrics {
  const startIso = parseToIsoDate(task.startDate);
  const endIso = parseToIsoDate(task.endDate);

  // If task is completed and completionDate exists, duration = completionDate - startDate + 1
  // Otherwise, duration = endDate - startDate + 1
  const compIso = task.completed && task.completionDate ? parseToIsoDate(task.completionDate) : endIso;
  const durationDays = Math.max(1, diffInDays(compIso, startIso) + 1);
  const daysRemaining = diffInDays(endIso, referenceToday);

  let status: TaskStatus = 'ON_TIME';
  let statusLabel = '🟢 Đúng hạn';
  let statusColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';

  if (task.dropped) {
    status = 'STOPPED';
    statusLabel = '⛔ Dừng';
    statusColor = 'bg-slate-200 text-slate-700 border-slate-300';
  } else if (task.completed) {
    status = 'COMPLETED';
    const compIso = task.completionDate ? parseToIsoDate(task.completionDate) : referenceToday;
    const diffComp = diffInDays(endIso, compIso); // endIso - compIso
    if (diffComp >= 0) {
      statusLabel = '🟢 Đúng hạn';
      statusColor = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
    } else {
      statusLabel = '🔴 Trễ hạn';
      statusColor = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
    }
  } else if (daysRemaining < 0) {
    status = 'OVERDUE';
    statusLabel = `🔴 Quá hạn (${Math.abs(daysRemaining)} ngày)`;
    statusColor = 'bg-red-100 text-red-800 border-red-300 font-bold animate-pulse';
  } else if (daysRemaining === 0) {
    status = 'DUE_SOON_1';
    statusLabel = '🟠 Đến hạn hôm nay';
    statusColor = 'bg-orange-100 text-orange-900 border-orange-400 font-semibold';
  } else if (daysRemaining === 1) {
    status = 'DUE_SOON_1';
    statusLabel = '🟠 Còn 1 ngày';
    statusColor = 'bg-orange-100 text-orange-900 border-orange-400 font-semibold';
  } else if (daysRemaining === 2) {
    status = 'DUE_SOON_2';
    statusLabel = '🟠 Còn 2 ngày';
    statusColor = 'bg-orange-100 text-orange-800 border-orange-300 font-medium';
  } else {
    status = 'ON_TIME';
    statusLabel = `🟢 Đúng hạn (còn ${daysRemaining} ngày)`;
    statusColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  }

  return {
    durationDays,
    daysRemaining,
    status,
    statusLabel,
    statusColor,
  };
}
