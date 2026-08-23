import { useMemo, useEffect } from 'react';
import { Clock, CheckCircle2, Flame, Play, Pause, Square, Plus, ListPlus, Layers, AlertTriangle, Inbox, Edit3, Archive, BookOpen, Quote } from 'lucide-react';
import { useTaskStore } from '../stores/taskStore';
import { useTimerStore } from '../stores/timerStore';
import { StatisticsService } from '../services/statistics-service';
import { RecurrenceService } from '../services/recurrence-service';
import { VerseService } from '../services/verse-service';
import { formatTimer, formatDate, formatDuration, MONTH_NAMES } from '../utils/date';
import { toast } from '../components/UI/Toast';
import styles from './Dashboard.module.css';

export default function Dashboard({ onNewTask, onBulkAdd, onBatchAdd }) {
  const { refreshKey, toggleCompletion, archiveTask, restoreTask } = useTaskStore();
  const timer = useTimerStore();

  useEffect(() => { timer.subscribe(); return () => timer.unsubscribe(); }, []);

  const todaysVerse = useMemo(() => VerseService.getTodaysVerse(), []);

  const data = useMemo(() => {
    const { oneTime, recurring } = useTaskStore.getState().getTodaysTasks();
    const overdue = useTaskStore.getState().getOverdueTasks();
    const stats = StatisticsService.getDailyStats();
    const completedCount = oneTime.filter((t) => t.status === 'completed').length + recurring.filter((t) => t.occurrence?.status === 'completed').length;
    const totalCount = oneTime.length + recurring.length;
    let bestStreak = 0, bestTask = '';
    for (const t of recurring) { const s = RecurrenceService.getStreak(t.id); if (s > bestStreak) { bestStreak = s; bestTask = t.title; } }
    return { oneTime, recurring, overdue, stats, completedCount, totalCount, bestStreak, bestTask };
  }, [refreshKey]);

  const handleToggle = (taskId, type, occId) => { toggleCompletion(taskId, type === 'recurring' ? occId : undefined); };
  const handleArchive = (taskId) => { archiveTask(taskId); toast.success('Task archived', { label: 'Undo', fn: () => restoreTask(taskId) }); };
  const handleTimer = (taskId, occId) => { try { timer.start(taskId, occId); } catch (err) { toast.error(err.message); } };

  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth(), todayDate = now.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  return (
    <div className={styles.grid}>
      <section className={styles.main}>
        {/* Stat Cards — compact */}
        <div className={styles.statsRow}>
          <div className={`${styles.statCard} glass`}>
            <div className={styles.statTop}><span className={styles.statLabel}>Productive Time</span><Clock size={14} className={styles.statIcon} /></div>
            <div className={styles.statValue}>{data.stats?.totalTimeFormatted || '0m'}</div>
            <div className={styles.statSub}>+Today</div>
          </div>
          <div className={`${styles.statCard} glass`}>
            <div className={styles.statTop}><span className={styles.statLabel}>Tasks Today</span><CheckCircle2 size={14} className={styles.statIcon} /></div>
            <div className={styles.statValue}>{data.completedCount} / {data.totalCount}</div>
            <div className={styles.statSub}>{data.totalCount > 0 ? Math.round((data.completedCount / data.totalCount) * 100) : 0}% done</div>
          </div>
          <div className={`${styles.statCard} glass`}>
            <div className={styles.statTop}><span className={styles.statLabel}>Best Streak</span><Flame size={14} className={styles.statIconFire} /></div>
            <div className={styles.statValue}>{data.bestStreak > 0 ? `${data.bestStreak} Days` : '—'}</div>
            <div className={styles.statSub}>{data.bestStreak > 0 ? `🔥 ${data.bestTask}` : 'Start a streak!'}</div>
          </div>
        </div>

        {/* Daily Verse / Wisdom Card */}
        {todaysVerse && (
          <div className={`${styles.verseCard} glass`}>
            <div className={styles.verseGlow} />
            <div className={styles.verseHeader}>
              <div className={styles.verseTitleGroup}>
                <div className={styles.verseIconWrap}>
                  <BookOpen size={13} />
                </div>
                <span className={styles.verseTag}>Daily Wisdom</span>
                <span className={styles.verseDivider}>•</span>
                <span className={styles.verseBadge}>
                  Chapter {todaysVerse.chapter}, Verse {todaysVerse.verse}
                </span>
              </div>
              <span className={styles.verseSource}>Chanakya Niti</span>
            </div>

            <div className={styles.verseBody}>
              <Quote size={18} className={styles.quoteIcon} />
              <p className={styles.verseText}>"{todaysVerse.text}"</p>
            </div>
          </div>
        )}

        {/* Today's Tasks */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Today's Schedule <span className={styles.badge}>{data.totalCount}</span></h2>
            <div className={styles.headerButtons}>
              <button className="btn btn-secondary btn-sm" onClick={onBulkAdd} title="Quick paste multiple tasks">
                <ListPlus size={14} /> Bulk Add
              </button>
              <button className="btn btn-secondary btn-sm" onClick={onBatchAdd} title="Add multiple structured tasks">
                <Layers size={14} /> Batch Form
              </button>
              <button className="btn btn-primary btn-sm" onClick={onNewTask} title="Create single task">
                <Plus size={14} /> New Task
              </button>
            </div>
          </div>

          {data.overdue.length > 0 && (
            <div className={styles.overdueBox}>
              <div className={styles.overdueHeader}><AlertTriangle size={14} /> Overdue ({data.overdue.length})</div>
              {data.overdue.map((t) => (
                <div key={t.id} className={styles.overdueItem}>
                  <span className={`${styles.priorityDot} ${styles[`p_${t.priority}`]}`} />
                  <span>{t.title}</span>
                  <span className={styles.overdueDate}>{formatDate(t.deadline, { short: true })}</span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.taskList}>
            {data.recurring.map((t) => {
              const isCompleted = t.occurrence?.status === 'completed';
              const progress = RecurrenceService.getTodayProgress(t.id);
              const streak = RecurrenceService.getStreak(t.id);
              return (
                <div key={t.id} className={`${styles.taskCard} glass ${isCompleted ? styles.completed : ''}`}>
                  <button className={`${styles.checkbox} ${isCompleted ? styles.checked : ''}`} onClick={() => handleToggle(t.id, 'recurring', t.occurrence?.id)}>
                    {isCompleted && <CheckCircle2 size={14} />}
                  </button>
                  <div className={styles.taskMain}>
                    <span className={`${styles.taskTitle} ${isCompleted ? styles.strikethrough : ''}`}>{t.title}</span>
                    {t.description && <p className={styles.taskDesc}>{t.description}</p>}
                    <div className={styles.taskMeta}>
                      <span className={`${styles.priorityBadge} ${styles[`p_${t.priority}`]}`}>{t.priority}</span>
                      {streak > 0 && <span className={styles.streak}>🔥 {streak}d</span>}
                      {(t.tags || []).map((tag) => <span key={tag.id} className={styles.tag}>#{tag.name}</span>)}
                    </div>
                  </div>
                  {progress.target > 0 && (
                    <div className={styles.progressWrap}>
                      <span className={styles.progressText}>{progress.current}/{progress.target}m</span>
                      <div className={styles.progressTrack}><div className={`${styles.progressFill} ${progress.percentage >= 100 ? styles.progressDone : ''}`} style={{ width: `${progress.percentage}%` }} /></div>
                    </div>
                  )}
                  <div className={styles.taskActions}>
                    <button className={styles.actionBtn} onClick={() => handleTimer(t.id, t.occurrence?.id)} title="Start Timer"><Play size={13} /></button>
                  </div>
                </div>
              );
            })}
            {data.oneTime.map((t) => {
              const isCompleted = t.status === 'completed';
              return (
                <div key={t.id} className={`${styles.taskCard} glass ${isCompleted ? styles.completed : ''}`}>
                  <button className={`${styles.checkbox} ${isCompleted ? styles.checked : ''}`} onClick={() => handleToggle(t.id, 'one_time')}>
                    {isCompleted && <CheckCircle2 size={14} />}
                  </button>
                  <div className={styles.taskMain}>
                    <span className={`${styles.taskTitle} ${isCompleted ? styles.strikethrough : ''}`}>{t.title}</span>
                    {t.description && <p className={styles.taskDesc}>{t.description}</p>}
                    <div className={styles.taskMeta}>
                      <span className={`${styles.priorityBadge} ${styles[`p_${t.priority}`]}`}>{t.priority}</span>
                      {t.deadline && <span className={`${styles.metaItem} ${new Date(t.deadline) < new Date() && !isCompleted ? styles.overdueMeta : ''}`}>{formatDate(t.deadline, { relative: true })}</span>}
                      {t.estimated_duration && <span className={styles.metaItem}>{formatDuration(t.estimated_duration)}</span>}
                    </div>
                  </div>
                  <div className={styles.taskActions}>
                    <button className={styles.actionBtn} onClick={() => handleTimer(t.id)} title="Timer"><Play size={13} /></button>
                    <button className={styles.actionBtn} onClick={() => handleArchive(t.id)} title="Archive"><Archive size={13} /></button>
                  </div>
                </div>
              );
            })}
            {data.oneTime.length === 0 && data.recurring.length === 0 && (
              <div className={styles.empty}><Inbox size={40} strokeWidth={1} /><p className={styles.emptyTitle}>No tasks for today</p><p className={styles.emptyText}>Create a new task to get started with your day.</p></div>
            )}
          </div>
        </div>
      </section>

      <aside className={styles.side}>
        {/* Timer Widget */}
        <div className={`glass ${styles.timerWidget} ${timer.activeSession ? styles.timerActive : ''}`}>
          {timer.activeSession ? (
            <>
              <div className={styles.timerLabel}>Active Timer</div>
              <div className={styles.timerTask}>{timer.activeSession.task_title || 'Task'}</div>
              <div className={styles.timerDisplay}>{formatTimer(timer.elapsed)}</div>
              <div className={styles.timerControls}>
                {timer.isPaused ? <button className="btn btn-primary btn-sm" onClick={timer.resume}><Play size={14} /> Resume</button> : <button className="btn btn-secondary btn-sm" onClick={timer.pause}><Pause size={14} /> Pause</button>}
                <button className="btn btn-danger btn-sm" onClick={() => { timer.stop(); toast.success('Timer stopped'); }}><Square size={14} /> Stop</button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.timerLabelIdle}>Time Tracking</div>
              <div className={styles.timerDisplayIdle}>00:00:00</div>
              <p className={styles.timerHint}>Click ▶ on a task to start tracking</p>
            </>
          )}
        </div>

        {/* Mini Calendar */}
        <div className={`glass ${styles.calendar}`}>
          <div className={styles.calHeader}>{MONTH_NAMES[month]} {year}</div>
          <div className={styles.calGrid}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i} className={styles.calDayLabel}>{d}</div>)}
            {Array.from({ length: offset }, (_, i) => <div key={`e${i}`} className={styles.calCell} style={{ opacity: 0 }} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1;
              const isToday = d === todayDate;
              const isPast = d < todayDate;
              return <div key={d} className={`${styles.calCell} ${isToday ? styles.calToday : ''} ${isPast ? styles.calPast : ''}`}>{d}</div>;
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
