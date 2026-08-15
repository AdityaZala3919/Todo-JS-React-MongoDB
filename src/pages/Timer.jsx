import { useState, useMemo, useEffect } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { useTimerStore } from '../stores/timerStore';
import { useTaskStore } from '../stores/taskStore';
import { StatisticsService } from '../services/statistics-service';
import { formatTimer, formatTime, formatDuration } from '../utils/date';
import { toast } from '../components/UI/Toast';
import styles from './Timer.module.css';

export default function TimerPage() {
  const timer = useTimerStore();
  const { refreshKey } = useTaskStore();
  const [selectedTask, setSelectedTask] = useState('');

  useEffect(() => { timer.subscribe(); return () => timer.unsubscribe(); }, []);

  const data = useMemo(() => {
    const { oneTime, recurring } = useTaskStore.getState().getTodaysTasks();
    const sessions = StatisticsService.getTodaySessions();
    return { tasks: [...recurring, ...oneTime.filter((t) => t.status !== 'completed')], sessions };
  }, [refreshKey, timer.elapsed]);

  const handleStart = () => {
    if (!selectedTask) { toast.error('Select a task first'); return; }
    try { timer.start(selectedTask); } catch (err) { toast.error(err.message); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.timerSection}>
        <h1 className={styles.title}>Time Tracker</h1>
        <div className={`glass ${styles.timerCard} ${timer.activeSession ? styles.active : ''}`}>
          <div className={styles.display}>{formatTimer(timer.activeSession ? timer.elapsed : 0)}</div>
          {timer.activeSession ? (
            <>
              <p className={styles.taskLabel}>Tracking: <strong>{timer.activeSession.task_title || 'Task'}</strong></p>
              <div className={styles.controls}>
                {timer.isPaused ? <button className="btn btn-primary" onClick={timer.resume}><Play size={16} /> Resume</button> : <button className="btn btn-secondary" onClick={timer.pause}><Pause size={16} /> Pause</button>}
                <button className="btn btn-danger" onClick={() => { timer.stop(); toast.success('Session saved'); }}><Square size={16} /> Stop</button>
              </div>
            </>
          ) : (
            <>
              <select className={`input ${styles.taskSelect}`} value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}>
                <option value="">Select a task...</option>
                {data.tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
              <button className="btn btn-primary" onClick={handleStart} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}><Play size={16} /> Start Timer</button>
            </>
          )}
        </div>
      </div>
      <div className={styles.historySection}>
        <h2 className={styles.subtitle}>Today's Sessions</h2>
        {data.sessions.length === 0 ? <p className={styles.noSessions}>No sessions recorded today</p> : (
          <div className={styles.sessionList}>
            {data.sessions.map((s) => (
              <div key={s.id} className={`glass ${styles.sessionItem}`}>
                <div className={styles.sessionInfo}>
                  <span className={styles.sessionTask}>{s.task_title}</span>
                  <span className={styles.sessionTime}>{formatTime(s.start_time)} — {s.end_time ? formatTime(s.end_time) : 'Running'}</span>
                </div>
                <span className={styles.sessionDuration}>{s.duration ? formatDuration(Math.round(s.duration / 60)) : '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
