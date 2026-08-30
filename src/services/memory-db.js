import { Session } from './session.js';
import { EventBus, Events } from './events.js';

class MemoryDatabase {
  constructor() {
    this._initialized = false;
    this.users = [];
    this.projects = [];
    this.tags = [];
    this.tasks = [];
    this.task_tags = [];
    this.recurrence_rules = [];
    this.task_occurrences = [];
    this.time_sessions = [];
    this.user_settings = [];
    this.notes = [];
  }

  async init() {
    if (this._initialized) return;
    const userId = Session.getCurrentUserId();
    if (userId) {
      try {
        console.log('[MemoryDb] Bootstrapping user data from MongoDB...');
        await this.loadUserData(userId);
        console.log('[MemoryDb] Bootstrapping complete');
      } catch (err) {
        console.error('[MemoryDb] Bootstrapping failed:', err);
        EventBus.emit(Events.DB_ERROR, {
          type: 'init',
          message: 'Failed to bootstrap data from cloud database',
          error: err,
        });
        throw err;
      }
    } else {
      console.log('[MemoryDb] No active session, ready for authentication');
    }
    this._initialized = true;
    window.db = this;
  }

  async loadUserData(userId) {
    const response = await fetch(`/api/bootstrap?user_id=${encodeURIComponent(userId)}`, {
      headers: { 'x-user-id': userId },
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch user data');
    }
    const data = await response.json();
    const normalize = (arr) =>
      (arr || []).map((item) => {
        if (item._id && !item.id) item.id = item._id;
        return item;
      });
    this.users = normalize(data.users);
    this.projects = normalize(data.projects);
    this.tags = normalize(data.tags);
    this.tasks = normalize(data.tasks);
    this.task_tags = normalize(data.task_tags);
    this.recurrence_rules = normalize(data.recurrence_rules);
    this.task_occurrences = normalize(data.task_occurrences);
    this.time_sessions = normalize(data.time_sessions);
    this.user_settings = normalize(data.user_settings);
    this.notes = normalize(data.notes);
  }

  clear() {
    this.users = [];
    this.projects = [];
    this.tags = [];
    this.tasks = [];
    this.task_tags = [];
    this.recurrence_rules = [];
    this.task_occurrences = [];
    this.time_sessions = [];
    this.user_settings = [];
    this.notes = [];
    console.log('[MemoryDb] Local caches cleared');
  }

  sync(collection, action, data) {
    const userId = Session.getCurrentUserId();
    if (!userId) {
      console.warn('[MemoryDb] Cannot sync: No logged-in user');
      return;
    }
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ collection, action, data }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.error(`[Sync] Failed ${collection} (${action}):`, errData.error || response.statusText);
          EventBus.emit(Events.DB_ERROR, { type: 'sync', message: `Failed to sync ${collection}`, error: new Error(errData.error || response.statusText) });
        } else {
          EventBus.emit(Events.DB_SAVED);
        }
      })
      .catch((err) => {
        console.error(`[Sync] Network error ${collection} (${action}):`, err);
        EventBus.emit(Events.DB_ERROR, { type: 'sync', message: `Network error syncing ${collection}`, error: err });
      });
  }
}

export const MemoryDb = new MemoryDatabase();
