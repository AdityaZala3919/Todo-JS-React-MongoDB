/**
 * Date utilities — Formatting, comparison, and helper functions
 */
export function today() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function now() {
  return new Date().toISOString();
}

export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const { includeTime = false, relative = false, short = false } = options;
  if (relative) return getRelativeTime(date);
  if (short) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dateOpts = { month: 'short', day: 'numeric', year: 'numeric' };
  if (includeTime) { dateOpts.hour = '2-digit'; dateOpts.minute = '2-digit'; }
  return date.toLocaleDateString('en-US', dateOpts);
}

export function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function getRelativeTime(date) {
  const n = new Date();
  const diffMs = date.getTime() - n.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHrs = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHrs / 24);
  if (diffDays === 0) {
    if (diffHrs === 0) {
      if (diffMin === 0) return 'just now';
      if (diffMin > 0) return `in ${diffMin}m`;
      return `${Math.abs(diffMin)}m ago`;
    }
    if (diffHrs > 0) return `in ${diffHrs}h`;
    return `${Math.abs(diffHrs)}h ago`;
  }
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === -1) return 'yesterday';
  if (diffDays > 0 && diffDays <= 7) return `in ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  return formatDate(date.toISOString(), { short: true });
}

export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export function formatTimer(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return [
    hrs.toString().padStart(2, '0'),
    mins.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':');
}

export function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

export function isPast(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return d < todayStart;
}

export function isSameDay(a, b) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return false;
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function getDayOfWeek(dateStr) {
  if (!dateStr) return new Date().getDay();
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day).getDay();
  }
  return new Date(dateStr).getDay();
}

export function getDateRange(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export function getWeekEnd(date = new Date()) {
  const start = new Date(getWeekStart(date));
  start.setDate(start.getDate() + 6);
  return start.toISOString().split('T')[0];
}

export function getMonthStart(year, month) {
  return new Date(year, month, 1).toISOString().split('T')[0];
}

export function getMonthEnd(year, month) {
  return new Date(year, month + 1, 0).toISOString().split('T')[0];
}

export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
