import { MemoryDb } from '../services/memory-db.js';
import { now } from '../utils/date.js';

export const SettingsRepository = {
  get(userId) {
    let settings = MemoryDb.user_settings.find((s) => s.user_id === userId);
    if (!settings) {
      settings = { id: userId, user_id: userId, theme: 'dark', default_view: 'dashboard', week_start_day: 1, settings_json: '{}', updated_at: now() };
      MemoryDb.user_settings.push(settings); MemoryDb.sync('user_settings', 'insert', settings);
    }
    if (settings && settings.settings_json) { try { settings.extra = JSON.parse(settings.settings_json); } catch { settings.extra = {}; } }
    return settings;
  },
  update(userId, fields) {
    const settings = MemoryDb.user_settings.find((s) => s.user_id === userId); if (!settings) return;
    const allowed = ['theme', 'default_view', 'week_start_day', 'settings_json']; const updatedFields = {};
    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key)) { const val = key === 'settings_json' && typeof value === 'object' ? JSON.stringify(value) : value; settings[key] = val; updatedFields[key] = val; }
    }
    settings.updated_at = now(); updatedFields.updated_at = settings.updated_at;
    MemoryDb.sync('user_settings', 'update', { user_id: userId, ...updatedFields });
  },
};
