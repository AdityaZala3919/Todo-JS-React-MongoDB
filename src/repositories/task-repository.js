import { MemoryDb } from '../services/memory-db.js';
import { generateId } from '../utils/uuid.js';
import { now, today } from '../utils/date.js';

export const TaskRepository = {
  create(data) {
    const id = generateId();
    const timestamp = now();
    const task = {
      id, user_id: data.user_id, title: data.title.trim(),
      description: data.description || null, task_type: data.task_type,
      status: data.status || 'pending', priority: data.priority || 'medium',
      project_id: data.project_id || null, start_date: data.start_date || null,
      deadline: data.deadline || null, estimated_duration: data.estimated_duration || null,
      sort_order: data.sort_order || 0, notes: data.notes || null,
      created_at: timestamp, updated_at: timestamp,
    };
    MemoryDb.tasks.push(task);
    MemoryDb.sync('tasks', 'insert', task);
    return task;
  },
  getById(id) { return MemoryDb.tasks.find((t) => t.id === id) || null; },
  getByUser(userId, filters = {}) {
    let list = MemoryDb.tasks.filter((t) => t.user_id === userId);
    if (filters.task_type) list = list.filter((t) => t.task_type === filters.task_type);
    if (filters.status) {
      list = Array.isArray(filters.status)
        ? list.filter((t) => filters.status.includes(t.status))
        : list.filter((t) => t.status === filters.status);
    }
    if (filters.excludeStatus) {
      list = Array.isArray(filters.excludeStatus)
        ? list.filter((t) => !filters.excludeStatus.includes(t.status))
        : list.filter((t) => t.status !== filters.excludeStatus);
    }
    if (filters.priority) list = list.filter((t) => t.priority === filters.priority);
    if (filters.project_id) list = list.filter((t) => t.project_id === filters.project_id);
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    list.sort((a, b) => {
      if (filters.sort === 'created') return new Date(b.created_at) - new Date(a.created_at);
      if (filters.sort === 'due') {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1; if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      }
      if (filters.sort === 'priority') return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
      if (filters.sort === 'alpha') return a.title.localeCompare(b.title);
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    if (filters.limit) list = list.slice(0, filters.limit);
    return list;
  },
  getOverdue(userId) {
    const todayStr = today();
    return MemoryDb.tasks
      .filter((t) => t.user_id === userId && t.task_type === 'one_time' && t.deadline && t.deadline < todayStr && !['completed', 'archived'].includes(t.status))
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  },
  getRecurring(userId) {
    return MemoryDb.tasks
      .filter((t) => t.user_id === userId && t.task_type === 'recurring' && t.status !== 'archived')
      .map((t) => {
        const rule = MemoryDb.recurrence_rules.find((r) => r.task_id === t.id) || {};
        return { ...t, frequency: rule.frequency || null, days_of_week: rule.days_of_week || null, min_duration: rule.min_duration || null, min_count: rule.min_count || null, rule_id: rule.id || null };
      })
      .sort((a, b) => { if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order; return new Date(b.created_at) - new Date(a.created_at); });
  },
  update(id, fields) {
    const task = MemoryDb.tasks.find((t) => t.id === id);
    if (!task) return;
    const allowed = ['title', 'description', 'status', 'priority', 'project_id', 'start_date', 'deadline', 'estimated_duration', 'sort_order', 'completed_at', 'notes'];
    const updatedFields = {};
    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key)) { task[key] = value; updatedFields[key] = value; }
    }
    task.updated_at = now(); updatedFields.updated_at = task.updated_at;
    MemoryDb.sync('tasks', 'update', { id, ...updatedFields });
  },
  archive(id) { this.update(id, { status: 'archived' }); },
  delete(id) {
    const index = MemoryDb.tasks.findIndex((t) => t.id === id);
    if (index !== -1) { MemoryDb.tasks.splice(index, 1); MemoryDb.sync('tasks', 'delete', { id }); }
  },
  search(userId, query) {
    const lq = query.toLowerCase();
    return MemoryDb.tasks
      .filter((t) => t.user_id === userId && t.status !== 'archived' && ((t.title && t.title.toLowerCase().includes(lq)) || (t.description && t.description.toLowerCase().includes(lq))))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 50);
  },
  updateSortOrders(items) {
    const timestamp = now(); const syncItems = [];
    for (const item of items) {
      const task = MemoryDb.tasks.find((t) => t.id === item.id);
      if (task) { task.sort_order = item.sort_order; task.updated_at = timestamp; syncItems.push({ id: item.id, sort_order: item.sort_order, updated_at: timestamp }); }
    }
    if (syncItems.length > 0) MemoryDb.sync('tasks', 'bulk_update', syncItems);
  },
  countByStatus(userId) {
    const counts = {};
    for (const task of MemoryDb.tasks.filter((t) => t.user_id === userId)) { counts[task.status] = (counts[task.status] || 0) + 1; }
    return counts;
  },
};
