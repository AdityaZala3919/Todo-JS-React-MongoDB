import { SettingsRepository } from '../repositories/settings-repository.js';
import { Session } from './session.js';
import { EventBus, Events } from './events.js';

export const SettingsService = {
  getSettings() {
    const userId = Session.getCurrentUserId();
    if (!userId) return { theme: 'dark', default_view: 'dashboard', week_start_day: 1 };
    return SettingsRepository.get(userId);
  },
  updateSettings(fields) {
    const userId = Session.getCurrentUserId(); if (!userId) throw new Error('Not logged in');
    SettingsRepository.update(userId, fields);
  },
  getTheme() { return 'dark'; },
  setTheme(theme) { this.updateSettings({ theme: 'dark' }); this.applyTheme('dark'); EventBus.emit(Events.THEME_CHANGED, 'dark'); },
  applyTheme(theme) { document.documentElement.setAttribute('data-theme', 'dark'); },
  initTheme() { this.applyTheme('dark'); },
};
