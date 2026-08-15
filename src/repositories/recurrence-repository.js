import { MemoryDb } from '../services/memory-db.js';
import { generateId } from '../utils/uuid.js';
import { now } from '../utils/date.js';

export const RecurrenceRepository = {
  create(data) {
    const id = generateId(); const timestamp = now();
    const rule = { id, task_id: data.task_id, frequency: data.frequency, days_of_week: data.days_of_week ? JSON.stringify(data.days_of_week) : null, min_duration: data.min_duration || null, min_count: data.min_count || null, created_at: timestamp, updated_at: timestamp };
    MemoryDb.recurrence_rules.push(rule);
    MemoryDb.sync('recurrence_rules', 'insert', rule);
    return this.getById(id);
  },
  getById(id) { const rule = MemoryDb.recurrence_rules.find((r) => r.id === id); return rule ? this._parse(rule) : null; },
  getByTaskId(taskId) { const rule = MemoryDb.recurrence_rules.find((r) => r.task_id === taskId); return rule ? this._parse(rule) : null; },
  update(id, fields) {
    const rule = MemoryDb.recurrence_rules.find((r) => r.id === id);
    if (!rule) return;
    const allowed = ['frequency', 'days_of_week', 'min_duration', 'min_count'];
    const updatedFields = {};
    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key)) { const val = key === 'days_of_week' && Array.isArray(value) ? JSON.stringify(value) : value; rule[key] = val; updatedFields[key] = val; }
    }
    rule.updated_at = now(); updatedFields.updated_at = rule.updated_at;
    MemoryDb.sync('recurrence_rules', 'update', { id, ...updatedFields });
  },
  delete(id) {
    const index = MemoryDb.recurrence_rules.findIndex((r) => r.id === id);
    if (index !== -1) { MemoryDb.recurrence_rules.splice(index, 1); MemoryDb.sync('recurrence_rules', 'delete', { id }); }
  },
  _parse(rule) {
    const parsed = { ...rule };
    if (parsed.days_of_week && typeof parsed.days_of_week === 'string') {
      try { parsed.days_of_week = JSON.parse(parsed.days_of_week); } catch { parsed.days_of_week = []; }
    }
    return parsed;
  },
};
