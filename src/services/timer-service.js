import { TimeRepository } from '../repositories/time-repository.js';
import { OccurrenceRepository } from '../repositories/occurrence-repository.js';
import { Session } from './session.js';
import { EventBus, Events } from './events.js';
import { now } from '../utils/date.js';

class TimerServiceClass {
  constructor() {
    this._tickInterval = null;
    this._activeSessionId = null;
    this._startTimestamp = null;
    this._accumulatedSeconds = 0;
    this._isPaused = false;
    this._onBeforeUnload = this._onBeforeUnload.bind(this);
    if (typeof window !== 'undefined') window.addEventListener('beforeunload', this._onBeforeUnload);
  }

  start(taskId, occurrenceId) {
    const userId = Session.getCurrentUserId();
    if (!userId) throw new Error('Not logged in');
    if (this._activeSessionId) this.stop();

    const session = TimeRepository.create({ user_id: userId, task_id: taskId, occurrence_id: occurrenceId || null, start_time: now() });
    this._activeSessionId = session.id;
    this._startTimestamp = Date.now();
    this._accumulatedSeconds = 0;
    this._isPaused = false;

    this._startTicker(taskId, occurrenceId);
    EventBus.emit(Events.TIMER_STARTED, { sessionId: session.id, taskId, occurrenceId });
    return session;
  }

  _startTicker(taskId, occurrenceId) {
    if (this._tickInterval) clearInterval(this._tickInterval);
    this._tickInterval = setInterval(() => {
      if (!this._isPaused) {
        const elapsed = this.getElapsedSeconds();
        EventBus.emit(Events.TIMER_TICK, { sessionId: this._activeSessionId, elapsed, taskId, occurrenceId });
      }
    }, 1000);
  }

  stop() {
    if (!this._activeSessionId) return null;
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = null;
    }
    const elapsedSeconds = this.getElapsedSeconds();
    const sessionId = this._activeSessionId;

    TimeRepository.update(sessionId, { end_time: now(), duration: elapsedSeconds, is_paused: false });
    const session = TimeRepository.getById(sessionId);
    if (session && session.occurrence_id) {
      const total = TimeRepository.getTotalForOccurrence(session.occurrence_id);
      OccurrenceRepository.update(session.occurrence_id, { total_duration: Math.round(total / 60) });
    }

    this._activeSessionId = null;
    this._startTimestamp = null;
    this._accumulatedSeconds = 0;
    this._isPaused = false;

    EventBus.emit(Events.TIMER_STOPPED, { sessionId, duration: elapsedSeconds });
    return TimeRepository.getById(sessionId);
  }

  pause() {
    if (!this._activeSessionId || this._isPaused) return;
    this._accumulatedSeconds = this.getElapsedSeconds();
    this._startTimestamp = null;
    this._isPaused = true;
    TimeRepository.update(this._activeSessionId, { duration: this._accumulatedSeconds, is_paused: true });
    EventBus.emit(Events.TIMER_PAUSED, { sessionId: this._activeSessionId });
  }

  resume() {
    if (!this._activeSessionId || !this._isPaused) return;
    this._startTimestamp = Date.now();
    this._isPaused = false;
    TimeRepository.update(this._activeSessionId, { is_paused: false });
    
    const session = this.getActiveSession();
    if (session) {
      this._startTicker(session.task_id, session.occurrence_id);
    }
    EventBus.emit(Events.TIMER_RESUMED, { sessionId: this._activeSessionId });
  }

  getElapsedSeconds() {
    if (!this._activeSessionId) return 0;
    if (this._isPaused || !this._startTimestamp) return this._accumulatedSeconds;
    const runningSessionSeconds = Math.max(0, Math.floor((Date.now() - this._startTimestamp) / 1000));
    return this._accumulatedSeconds + runningSessionSeconds;
  }

  isRunning() { return this._activeSessionId !== null && !this._isPaused; }
  isPaused() { return this._activeSessionId !== null && this._isPaused; }
  getActiveSession() { if (!this._activeSessionId) return null; return TimeRepository.getById(this._activeSessionId); }
  getActiveSessionId() { return this._activeSessionId; }

  restoreActiveTimer() {
    const userId = Session.getCurrentUserId();
    if (!userId) return null;
    const activeSession = TimeRepository.getActive(userId);
    if (activeSession) {
      this._activeSessionId = activeSession.id;
      this._accumulatedSeconds = activeSession.duration || 0;
      this._startTimestamp = null;
      this._isPaused = true; // Restore in paused state per requirements
      
      TimeRepository.update(activeSession.id, { duration: this._accumulatedSeconds, is_paused: true });
      return activeSession;
    }
    return null;
  }

  _onBeforeUnload() {
    if (this._activeSessionId) {
      const currentSeconds = this.getElapsedSeconds();
      TimeRepository.update(this._activeSessionId, { duration: currentSeconds, is_paused: true });
    }
  }

  destroy() {
    if (typeof window !== 'undefined') window.removeEventListener('beforeunload', this._onBeforeUnload);
    if (this._tickInterval) clearInterval(this._tickInterval);
  }
}

export const TimerService = new TimerServiceClass();
