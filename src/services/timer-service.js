import { TimeRepository } from '../repositories/time-repository.js';
import { OccurrenceRepository } from '../repositories/occurrence-repository.js';
import { Session } from './session.js';
import { EventBus, Events } from './events.js';
import { now } from '../utils/date.js';

class TimerServiceClass {
  constructor() {
    this._tickInterval = null; this._activeSessionId = null; this._startTimestamp = null; this._pausedAt = null; this._pausedDuration = 0;
    this._onBeforeUnload = this._onBeforeUnload.bind(this);
    if (typeof window !== 'undefined') window.addEventListener('beforeunload', this._onBeforeUnload);
  }
  start(taskId, occurrenceId) {
    const userId = Session.getCurrentUserId(); if (!userId) throw new Error('Not logged in');
    if (this._activeSessionId) this.stop();
    const session = TimeRepository.create({ user_id: userId, task_id: taskId, occurrence_id: occurrenceId || null, start_time: now() });
    this._activeSessionId = session.id; this._startTimestamp = Date.now(); this._pausedAt = null; this._pausedDuration = 0;
    this._tickInterval = setInterval(() => { if (!this._pausedAt) EventBus.emit(Events.TIMER_TICK, { sessionId: session.id, elapsed: this.getElapsedSeconds(), taskId, occurrenceId }); }, 1000);
    EventBus.emit(Events.TIMER_STARTED, { sessionId: session.id, taskId, occurrenceId }); return session;
  }
  stop() {
    if (!this._activeSessionId) return null;
    clearInterval(this._tickInterval); this._tickInterval = null;
    const elapsedSeconds = this.getElapsedSeconds(); const sessionId = this._activeSessionId;
    TimeRepository.update(sessionId, { end_time: now(), duration: elapsedSeconds });
    const session = TimeRepository.getById(sessionId);
    if (session && session.occurrence_id) { const total = TimeRepository.getTotalForOccurrence(session.occurrence_id); OccurrenceRepository.update(session.occurrence_id, { total_duration: Math.round(total / 60) }); }
    this._activeSessionId = null; this._startTimestamp = null; this._pausedAt = null; this._pausedDuration = 0;
    EventBus.emit(Events.TIMER_STOPPED, { sessionId, duration: elapsedSeconds }); return TimeRepository.getById(sessionId);
  }
  pause() { if (!this._activeSessionId || this._pausedAt) return; this._pausedAt = Date.now(); EventBus.emit(Events.TIMER_PAUSED, { sessionId: this._activeSessionId }); }
  resume() { if (!this._activeSessionId || !this._pausedAt) return; this._pausedDuration += Date.now() - this._pausedAt; this._pausedAt = null; EventBus.emit(Events.TIMER_RESUMED, { sessionId: this._activeSessionId }); }
  getElapsedSeconds() {
    if (!this._startTimestamp) return 0;
    const elapsed = this._pausedAt ? this._pausedAt - this._startTimestamp - this._pausedDuration : Date.now() - this._startTimestamp - this._pausedDuration;
    return Math.max(0, Math.floor(elapsed / 1000));
  }
  isRunning() { return this._activeSessionId !== null && this._pausedAt === null; }
  isPaused() { return this._activeSessionId !== null && this._pausedAt !== null; }
  getActiveSession() { if (!this._activeSessionId) return null; return TimeRepository.getById(this._activeSessionId); }
  getActiveSessionId() { return this._activeSessionId; }
  restoreActiveTimer() {
    const userId = Session.getCurrentUserId(); if (!userId) return;
    const activeSession = TimeRepository.getActive(userId);
    if (activeSession) {
      const startTime = new Date(activeSession.start_time).getTime();
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      TimeRepository.update(activeSession.id, { end_time: now(), duration: elapsedSeconds });
      if (activeSession.occurrence_id) { const total = TimeRepository.getTotalForOccurrence(activeSession.occurrence_id); OccurrenceRepository.update(activeSession.occurrence_id, { total_duration: Math.round(total / 60) }); }
    }
  }
  _onBeforeUnload() { if (this._activeSessionId) this.stop(); }
  destroy() { if (typeof window !== 'undefined') window.removeEventListener('beforeunload', this._onBeforeUnload); clearInterval(this._tickInterval); }
}

export const TimerService = new TimerServiceClass();
