import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ListPlus, Layers, Play, Pause, Square, Clock } from 'lucide-react';
import { useTimerStore } from '../../stores/timerStore';
import { formatTimer } from '../../utils/date';
import { toast } from '../UI/Toast';
import styles from './TopBar.module.css';

export default function TopBar({ onNewTask, onBulkAdd, onBatchAdd }) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const timer = useTimerStore();

  useEffect(() => {
    timer.subscribe();
    return () => timer.unsubscribe();
  }, []);

  // Update HTML head document title with active timer
  useEffect(() => {
    if (timer.activeSession) {
      const timeStr = formatTimer(timer.elapsed);
      const title = timer.activeSession.task_title || 'Task';
      if (timer.isPaused) {
        document.title = `⏸ (${timeStr}) ${title} | TaskFlow`;
      } else {
        document.title = `⏱ ${timeStr} - ${title} | TaskFlow`;
      }
    } else {
      document.title = 'TaskFlow | Todo & Time Management';
    }
  }, [timer.activeSession, timer.elapsed, timer.isPaused]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/tasks?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className={styles.topBar}>
      <div className={styles.searchBox}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search tasks, projects..."
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
        <kbd className={styles.kbd}>/</kbd>
      </div>

      {timer.activeSession && (
        <div className={styles.topBarTimer}>
          <div className={styles.timerIndicator} data-running={!timer.isPaused}>
            <span className={styles.pulseDot} />
            <Clock size={13} className={!timer.isPaused ? styles.spinningClock : ''} />
          </div>
          <div
            className={styles.timerInfo}
            onClick={() => navigate('/timer')}
            title="Open Timer details"
          >
            <span className={styles.timerTaskTitle}>
              {timer.activeSession.task_title || 'Active Task'}
            </span>
            <span className={styles.timerTime}>{formatTimer(timer.elapsed)}</span>
          </div>
          <div className={styles.timerControls}>
            {timer.isPaused ? (
              <button
                className={`${styles.timerBtn} ${styles.timerResumeBtn}`}
                onClick={timer.resume}
                title="Resume Timer"
              >
                <Play size={12} />
              </button>
            ) : (
              <button
                className={`${styles.timerBtn} ${styles.timerPauseBtn}`}
                onClick={timer.pause}
                title="Pause Timer"
              >
                <Pause size={12} />
              </button>
            )}
            <button
              className={`${styles.timerBtn} ${styles.timerStopBtn}`}
              onClick={() => {
                timer.stop();
                toast.success('Timer stopped');
              }}
              title="Stop Timer"
            >
              <Square size={11} />
            </button>
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onBulkAdd}
          title="Quick Paste multiple tasks"
        >
          <ListPlus size={15} />
          <span className={styles.btnText}>Bulk Add</span>
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onBatchAdd}
          title="Add multiple structured tasks"
        >
          <Layers size={15} />
          <span className={styles.btnText}>Batch Form</span>
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={onNewTask}
          title="Create a new task"
        >
          <Plus size={16} />
          <span className={styles.btnText}>New Task</span>
        </button>
      </div>
    </header>
  );
}
