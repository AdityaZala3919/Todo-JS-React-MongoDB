import { MemoryDb } from '../services/memory-db.js';
import { generateId } from '../utils/uuid.js';
import { now } from '../utils/date.js';

export const OccurrenceRepository = {
  create(data) {
    const existing = this.getByTaskAndDate(data.task_id, data.occurrence_date);
    if (existing) return existing;
    const id = generateId();
    const occurrence = { id, task_id: data.task_id, occurrence_date: data.occurrence_date, status: data.status || 'pending', total_duration: data.total_duration || 0, created_at: now() };
    MemoryDb.task_occurrences.push(occurrence);
    MemoryDb.sync('task_occurrences', 'insert', occurrence);
    return occurrence;
  },
  getById(id) { return MemoryDb.task_occurrences.find((o) => o.id === id) || null; },
  getByTaskAndDate(taskId, date) { return MemoryDb.task_occurrences.find((o) => o.task_id === taskId && o.occurrence_date === date) || null; },
  getByTask(taskId, startDate, endDate) {
    let list = MemoryDb.task_occurrences.filter((o) => o.task_id === taskId);
    if (startDate && endDate) list = list.filter((o) => o.occurrence_date >= startDate && o.occurrence_date <= endDate);
    return list.sort((a, b) => a.occurrence_date.localeCompare(b.occurrence_date));
  },
  getByDate(taskId, date) { return this.getByTaskAndDate(taskId, date); },
  getByUserAndDate(userId, date) {
    const matches = [];
    for (const occ of MemoryDb.task_occurrences) {
      if (occ.occurrence_date === date) {
        const task = MemoryDb.tasks.find((t) => t.id === occ.task_id);
        if (task && task.user_id === userId) matches.push({ ...occ, title: task.title, priority: task.priority, project_id: task.project_id, sort_order: task.sort_order || 0 });
      }
    }
    return matches.sort((a, b) => a.sort_order - b.sort_order);
  },
  update(id, fields) {
    const occurrence = MemoryDb.task_occurrences.find((o) => o.id === id);
    if (!occurrence) return;
    const allowed = ['status', 'total_duration', 'completed_at'];
    const updatedFields = {};
    for (const [key, value] of Object.entries(fields)) { if (allowed.includes(key)) { occurrence[key] = value; updatedFields[key] = value; } }
    MemoryDb.sync('task_occurrences', 'update', { id, ...updatedFields });
  },
  getCompletionHistory(taskId) {
    return MemoryDb.task_occurrences.filter((o) => o.task_id === taskId).sort((a, b) => b.occurrence_date.localeCompare(a.occurrence_date));
  },
  countCompleted(taskId, startDate, endDate) {
    return MemoryDb.task_occurrences.filter((o) => o.task_id === taskId && o.status === 'completed' && o.occurrence_date >= startDate && o.occurrence_date <= endDate).length;
  },
  countTotal(taskId, startDate, endDate) {
    return MemoryDb.task_occurrences.filter((o) => o.task_id === taskId && o.occurrence_date >= startDate && o.occurrence_date <= endDate).length;
  },
  delete(id) {
    const index = MemoryDb.task_occurrences.findIndex((o) => o.id === id);
    if (index !== -1) { MemoryDb.task_occurrences.splice(index, 1); MemoryDb.sync('task_occurrences', 'delete', { id }); }
  },
};
