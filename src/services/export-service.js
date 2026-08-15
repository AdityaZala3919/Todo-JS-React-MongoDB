import { MemoryDb } from './memory-db.js';
import { Session } from './session.js';
import { EventBus, Events } from './events.js';
import { validateImportData } from '../utils/validation.js';
import { now } from '../utils/date.js';

const CURRENT_SCHEMA_VERSION = 1;

export const ExportService = {
  exportUserData() {
    const userId = Session.getCurrentUserId(); if (!userId) throw new Error('Not logged in');
    const tasks = MemoryDb.tasks.filter((t) => t.user_id === userId);
    const taskIds = tasks.map((t) => t.id);
    const data = {
      schema_version: CURRENT_SCHEMA_VERSION, exported_at: now(),
      data: {
        tasks, projects: MemoryDb.projects.filter((p) => p.user_id === userId),
        tags: MemoryDb.tags.filter((t) => t.user_id === userId),
        task_tags: MemoryDb.task_tags.filter((tt) => taskIds.includes(tt.task_id)),
        recurrence_rules: MemoryDb.recurrence_rules.filter((r) => taskIds.includes(r.task_id)),
        task_occurrences: MemoryDb.task_occurrences.filter((o) => taskIds.includes(o.task_id)),
        time_sessions: MemoryDb.time_sessions.filter((ts) => ts.user_id === userId),
        settings: MemoryDb.user_settings.find((s) => s.user_id === userId) || null,
      },
    };
    EventBus.emit(Events.DATA_EXPORTED); return data;
  },
  downloadExport() {
    const data = this.exportUserData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `taskflow-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  },
  importUserData(jsonString) {
    const userId = Session.getCurrentUserId(); if (!userId) throw new Error('Not logged in');
    let parsed; try { parsed = JSON.parse(jsonString); } catch { return { success: false, message: 'Invalid JSON file' }; }
    const validation = validateImportData(parsed); if (!validation.valid) return { success: false, message: validation.error };
    if (parsed.schema_version > CURRENT_SCHEMA_VERSION) return { success: false, message: `Export is from a newer version (v${parsed.schema_version}).` };
    try {
      const d = parsed.data;
      const upsert = (arr, item, idField = 'id') => {
        const idx = arr.findIndex((x) => x[idField] === item[idField]);
        if (idx !== -1) arr[idx] = item; else arr.push(item);
      };
      if (d.projects) for (const p of d.projects) { const proj = { ...p, user_id: userId }; upsert(MemoryDb.projects, proj); MemoryDb.sync('projects', 'insert', proj); }
      if (d.tags) for (const t of d.tags) { const tag = { ...t, user_id: userId }; upsert(MemoryDb.tags, tag); MemoryDb.sync('tags', 'insert', tag); }
      if (d.tasks) for (const t of d.tasks) { const task = { ...t, user_id: userId }; upsert(MemoryDb.tasks, task); MemoryDb.sync('tasks', 'insert', task); }
      if (d.task_tags) for (const tt of d.task_tags) { if (!MemoryDb.task_tags.some((x) => x.task_id === tt.task_id && x.tag_id === tt.tag_id)) { MemoryDb.task_tags.push(tt); MemoryDb.sync('task_tags', 'insert', tt); } }
      if (d.recurrence_rules) for (const r of d.recurrence_rules) { upsert(MemoryDb.recurrence_rules, r); MemoryDb.sync('recurrence_rules', 'insert', r); }
      if (d.task_occurrences) for (const o of d.task_occurrences) { upsert(MemoryDb.task_occurrences, o); MemoryDb.sync('task_occurrences', 'insert', o); }
      if (d.time_sessions) for (const s of d.time_sessions) { const sess = { ...s, user_id: userId }; upsert(MemoryDb.time_sessions, sess); MemoryDb.sync('time_sessions', 'insert', sess); }
      if (d.settings) { const settings = { ...d.settings, id: userId, user_id: userId, updated_at: now() }; const idx = MemoryDb.user_settings.findIndex((x) => x.user_id === userId); if (idx !== -1) MemoryDb.user_settings[idx] = settings; else MemoryDb.user_settings.push(settings); MemoryDb.sync('user_settings', 'insert', settings); }
      EventBus.emit(Events.DATA_IMPORTED); return { success: true, message: 'Data imported successfully' };
    } catch (err) { return { success: false, message: `Import failed: ${err.message}` }; }
  },
};
