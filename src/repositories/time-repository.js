import { MemoryDb } from '../services/memory-db.js';
import { generateId } from '../utils/uuid.js';
import { now } from '../utils/date.js';

export const TimeRepository = {
  create(data) {
    const id = generateId();
    const session = { id, user_id: data.user_id, task_id: data.task_id, occurrence_id: data.occurrence_id || null, start_time: data.start_time, end_time: null, duration: null, notes: null, created_at: now() };
    MemoryDb.time_sessions.push(session);
    MemoryDb.sync('time_sessions', 'insert', session);
    return session;
  },
  getById(id) { return MemoryDb.time_sessions.find((ts) => ts.id === id) || null; },
  update(id, fields) {
    const session = MemoryDb.time_sessions.find((ts) => ts.id === id);
    if (!session) return;
    const allowed = ['end_time', 'duration', 'notes', 'occurrence_id'];
    const updatedFields = {};
    for (const [key, value] of Object.entries(fields)) { if (allowed.includes(key)) { session[key] = value; updatedFields[key] = value; } }
    MemoryDb.sync('time_sessions', 'update', { id, ...updatedFields });
  },
  getByTask(taskId, startDate, endDate) {
    let list = MemoryDb.time_sessions.filter((ts) => ts.task_id === taskId);
    if (startDate && endDate) {
      list = list.filter((ts) => { const d = ts.start_time.split('T')[0]; return d >= startDate && d <= endDate; });
      list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    } else { list.sort((a, b) => b.start_time.localeCompare(a.start_time)); }
    return list;
  },
  getByOccurrence(occurrenceId) {
    return MemoryDb.time_sessions.filter((ts) => ts.occurrence_id === occurrenceId).sort((a, b) => a.start_time.localeCompare(b.start_time));
  },
  getByUserAndDate(userId, date) {
    return MemoryDb.time_sessions
      .filter((ts) => ts.user_id === userId && ts.start_time.split('T')[0] === date)
      .map((ts) => { const task = MemoryDb.tasks.find((t) => t.id === ts.task_id) || {}; return { ...ts, task_title: task.title || 'Unknown Task' }; })
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  },
  getTotalForTask(taskId) {
    return MemoryDb.time_sessions.filter((ts) => ts.task_id === taskId && ts.duration !== null).reduce((sum, ts) => sum + (ts.duration || 0), 0);
  },
  getTotalForDate(userId, date) {
    return MemoryDb.time_sessions.filter((ts) => ts.user_id === userId && ts.start_time.split('T')[0] === date && ts.duration !== null).reduce((sum, ts) => sum + (ts.duration || 0), 0);
  },
  getTotalForDateRange(userId, startDate, endDate) {
    return MemoryDb.time_sessions.filter((ts) => { if (ts.user_id !== userId || ts.duration === null) return false; const d = ts.start_time.split('T')[0]; return d >= startDate && d <= endDate; }).reduce((sum, ts) => sum + (ts.duration || 0), 0);
  },
  getTotalForOccurrence(occurrenceId) {
    return MemoryDb.time_sessions.filter((ts) => ts.occurrence_id === occurrenceId && ts.duration !== null).reduce((sum, ts) => sum + (ts.duration || 0), 0);
  },
  getActive(userId) {
    const active = MemoryDb.time_sessions.filter((ts) => ts.user_id === userId && ts.end_time === null).sort((a, b) => b.start_time.localeCompare(a.start_time))[0];
    if (active) { const task = MemoryDb.tasks.find((t) => t.id === active.task_id) || {}; return { ...active, task_title: task.title || 'Unknown Task' }; }
    return null;
  },
  delete(id) {
    const index = MemoryDb.time_sessions.findIndex((ts) => ts.id === id);
    if (index !== -1) { MemoryDb.time_sessions.splice(index, 1); MemoryDb.sync('time_sessions', 'delete', { id }); }
  },
};
