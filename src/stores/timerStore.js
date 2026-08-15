import { create } from 'zustand';
import { TimerService } from '../services/timer-service.js';
import { EventBus, Events } from '../services/events.js';

export const useTimerStore = create((set, get) => ({
  elapsed: 0,
  isRunning: false,
  isPaused: false,
  activeSession: null,
  _unsub: null,

  syncState: () => {
    set({
      isRunning: TimerService.isRunning(),
      isPaused: TimerService.isPaused(),
      activeSession: TimerService.getActiveSession(),
      elapsed: TimerService.getElapsedSeconds(),
    });
  },

  subscribe: () => {
    const tickUnsub = EventBus.on(Events.TIMER_TICK, ({ elapsed }) => {
      set({ elapsed, isRunning: true, isPaused: false });
    });
    const stopUnsub = EventBus.on(Events.TIMER_STOPPED, () => {
      set({ elapsed: 0, isRunning: false, isPaused: false, activeSession: null });
    });
    const pauseUnsub = EventBus.on(Events.TIMER_PAUSED, () => set({ isPaused: true, isRunning: false }));
    const resumeUnsub = EventBus.on(Events.TIMER_RESUMED, () => set({ isPaused: false, isRunning: true }));
    set({ _unsub: () => { tickUnsub(); stopUnsub(); pauseUnsub(); resumeUnsub(); } });
    get().syncState();
  },

  unsubscribe: () => { const unsub = get()._unsub; if (unsub) unsub(); },

  start: (taskId, occurrenceId) => {
    const session = TimerService.start(taskId, occurrenceId);
    set({ activeSession: TimerService.getActiveSession(), isRunning: true, isPaused: false, elapsed: 0 });
    return session;
  },
  stop: () => { TimerService.stop(); set({ activeSession: null, isRunning: false, isPaused: false, elapsed: 0 }); },
  pause: () => { TimerService.pause(); set({ isPaused: true, isRunning: false }); },
  resume: () => { TimerService.resume(); set({ isPaused: false, isRunning: true }); },
}));
