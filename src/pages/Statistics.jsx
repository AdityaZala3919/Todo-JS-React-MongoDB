import { useMemo } from 'react';
import { BarChart3, TrendingUp, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { useTaskStore } from '../stores/taskStore';
import { StatisticsService } from '../services/statistics-service';
import { getWeekStart, getWeekEnd, formatDate, formatDuration } from '../utils/date';
import styles from './Statistics.module.css';

export default function Statistics() {
  const { refreshKey } = useTaskStore();

  const stats = useMemo(() => {
    const daily = StatisticsService.getDailyStats();
    const weekly = StatisticsService.getWeeklyStats();
    const sessions = StatisticsService.getTodaySessions();
    return { daily, weekly, sessions };
  }, [refreshKey]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Productivity Statistics</h1>
      
      <div className={styles.grid}>
        {/* Daily Stats */}
        <div className={`glass ${styles.card}`}>
          <div className={styles.cardHeader}>
            <Clock size={16} className={styles.icon} />
            <h2>Today's Performance</h2>
          </div>
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Time Tracked</span>
              <span className={styles.metricValue}>{stats.daily?.totalTimeFormatted || '0m'}</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>One-time Tasks</span>
              <span className={styles.metricValue}>{stats.daily?.tasksCompleted || 0} completed</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Habits/Recurring</span>
              <span className={styles.metricValue}>
                {stats.daily?.recurringCompleted || 0} / {stats.daily?.recurringTotal || 0} ({stats.daily?.recurringRate || 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Stats */}
        <div className={`glass ${styles.card}`}>
          <div className={styles.cardHeader}>
            <TrendingUp size={16} className={styles.icon} />
            <h2>Weekly Summary</h2>
          </div>
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Week Range</span>
              <span className={styles.metricValueSub}>
                {formatDate(stats.weekly?.weekStart, { short: true })} – {formatDate(stats.weekly?.weekEnd, { short: true })}
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Total Time Tracked</span>
              <span className={styles.metricValue}>{stats.weekly?.totalTimeFormatted || '0m'}</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Daily Average</span>
              <span className={styles.metricValue}>{stats.weekly?.avgDailyTime || '0m'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.historySection}>
        <div className={styles.sectionHeader}>
          <Calendar size={16} className={styles.icon} />
          <h2>Today's Time Logs</h2>
        </div>
        {stats.sessions.length === 0 ? (
          <p className={styles.noData}>No work sessions recorded today.</p>
        ) : (
          <div className={styles.sessionList}>
            {stats.sessions.map((session) => (
              <div key={session.id} className={`glass ${styles.sessionItem}`}>
                <div className={styles.sessionInfo}>
                  <span className={styles.sessionTask}>{session.task_title}</span>
                  <span className={styles.sessionTime}>
                    {new Date(session.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                <div className={styles.sessionDuration}>
                  {session.duration ? formatDuration(Math.round(session.duration / 60)) : 'In Progress'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
