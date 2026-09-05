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
    this.visit_later = [];
  }

  _saveToLocalStorage(userId, data) {
    try {
      if (userId && data) {
        localStorage.setItem(`taskflow_cache_${userId}`, JSON.stringify(data));
      }
    } catch {}
  }

  _loadFromLocalStorage(userId) {
    try {
      if (!userId) return false;
      const raw = localStorage.getItem(`taskflow_cache_${userId}`);
      if (!raw) return false;
      const data = JSON.parse(raw);
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
      this.visit_later = normalize(data.visit_later);
      EventBus.emit(Events.DATA_IMPORTED, data);
      return true;
    } catch {
      return false;
    }
  }

  async init() {
    if (this._initialized) return;
    const userId = Session.getCurrentUserId();
    if (userId) {
      // Instant cache restore
      this._loadFromLocalStorage(userId);
      try {
        console.log('[MemoryDb] Bootstrapping user data from MongoDB...');
        await this.loadUserData(userId);
        console.log('[MemoryDb] Bootstrapping complete');
      } catch (err) {
        console.warn('[MemoryDb] Bootstrapping cloud sync issue:', err.message);
        if (this.users.length === 0) {
          EventBus.emit(Events.DB_ERROR, {
            type: 'init',
            message: 'Failed to bootstrap data from cloud database',
            error: err,
          });
          throw err;
        }
      }
    } else {
      console.log('[MemoryDb] No active session, ready for authentication');
    }
    this._initialized = true;
    window.db = this;
  }

  async loadUserData(userId) {
    if (this.users.length === 0) {
      this._loadFromLocalStorage(userId);
    }
    try {
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
      this.visit_later = normalize(data.visit_later);
      this._saveToLocalStorage(userId, data);
      EventBus.emit(Events.DATA_IMPORTED, data);
    } catch (err) {
      if (this.users.length > 0) {
        console.warn('[MemoryDb] Using local cache while cloud sync is pending:', err.message);
      } else {
        throw err;
      }
    }
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
    this.visit_later = [];
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
