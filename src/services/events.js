/**
 * EventBus — Lightweight pub/sub event system
 */
class EventBusClass {
  constructor() {
    this._listeners = new Map();
  }
  on(event, callback) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }
  once(event, callback) {
    const wrapper = (...args) => { this.off(event, wrapper); callback(...args); };
    this.on(event, wrapper);
  }
  off(event, callback) {
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) this._listeners.delete(event);
    }
  }
  emit(event, data) {
    const listeners = this._listeners.get(event);
    if (listeners) {
      for (const callback of listeners) {
        try { callback(data); } catch (err) { console.error(`[EventBus] Error in "${event}":`, err); }
      }
    }
  }
  clear(event) {
    if (event) this._listeners.delete(event);
    else this._listeners.clear();
  }
}

export const Events = {
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_REGISTER: 'auth:register',
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  TASK_COMPLETED: 'task:completed',
  TASK_ARCHIVED: 'task:archived',
  OCCURRENCE_COMPLETED: 'occurrence:completed',
  OCCURRENCE_UPDATED: 'occurrence:updated',
  TIMER_STARTED: 'timer:started',
  TIMER_STOPPED: 'timer:stopped',
  TIMER_TICK: 'timer:tick',
  TIMER_PAUSED: 'timer:paused',
  TIMER_RESUMED: 'timer:resumed',
  PROJECT_CREATED: 'project:created',
  PROJECT_UPDATED: 'project:updated',
  PROJECT_DELETED: 'project:deleted',
  TAG_CREATED: 'tag:created',
  TAG_UPDATED: 'tag:updated',
  TAG_DELETED: 'tag:deleted',
  DATA_IMPORTED: 'data:imported',
  DATA_EXPORTED: 'data:exported',
  DB_SAVED: 'db:saved',
  DB_ERROR: 'db:error',
  THEME_CHANGED: 'theme:changed',
  TOAST_SHOW: 'toast:show',
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  VIEW_CHANGED: 'view:changed',
  NAVIGATE: 'navigate',
};

export const EventBus = new EventBusClass();
