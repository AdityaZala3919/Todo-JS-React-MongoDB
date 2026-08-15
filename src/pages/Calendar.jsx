import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useTaskStore } from '../stores/taskStore';
import { OccurrenceRepository } from '../repositories/occurrence-repository';
import { TaskRepository } from '../repositories/task-repository';
import { TimeRepository } from '../repositories/time-repository';
import { Session } from '../services/session';
import { MONTH_NAMES, DAY_NAMES_SHORT, formatDuration, today } from '../utils/date';
import styles from './Calendar.module.css';

export default function CalendarPage() {
  const { refreshKey } = useTaskStore();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(today());

  const calData = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    return { daysInMonth, offset };
  }, [year, month]);

  const dayDetails = useMemo(() => {
    if (!selectedDate) return null;
    const userId = Session.getCurrentUserId(); if (!userId) return null;
    const occurrences = OccurrenceRepository.getByUserAndDate(userId, selectedDate);
    const oneTimeTasks = TaskRepository.getByUser(userId, { task_type: 'one_time', excludeStatus: 'archived' }).filter((t) => t.deadline && t.deadline.startsWith(selectedDate));
    const totalTime = TimeRepository.getTotalForDate(userId, selectedDate);
    return { occurrences, oneTimeTasks, totalTime };
  }, [selectedDate, refreshKey]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); };
  const todayStr = today();

  return (
    <div className={styles.page}>
      <div className={styles.calSection}>
        <div className={styles.calHeader}>
          <button className={styles.navBtn} onClick={prevMonth}><ChevronLeft size={18} /></button>
          <h1 className={styles.monthTitle}>{MONTH_NAMES[month]} {year}</h1>
          <button className={styles.navBtn} onClick={nextMonth}><ChevronRight size={18} /></button>
        </div>
        <div className={styles.dayLabels}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className={styles.dayLabel}>{d}</div>)}</div>
        <div className={styles.grid}>
          {Array.from({ length: calData.offset }, (_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: calData.daysInMonth }, (_, i) => {
            const d = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            return (
              <button key={d} className={`${styles.cell} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''}`} onClick={() => setSelectedDate(dateStr)}>
                {d}
              </button>
            );
          })}
        </div>
      </div>
      <div className={styles.detailSection}>
        <h2 className={styles.detailTitle}>{selectedDate === todayStr ? 'Today' : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
        {dayDetails && (
          <>
            <div className={styles.detailStat}>Time tracked: <strong>{formatDuration(Math.round(dayDetails.totalTime / 60))}</strong></div>
            {dayDetails.occurrences.length > 0 && (
              <div className={styles.detailGroup}><h3 className={styles.detailGroupTitle}>Recurring Tasks</h3>
                {dayDetails.occurrences.map((o) => (
                  <div key={o.id} className={`glass ${styles.detailItem}`}><span className={styles.detailItemText}>{o.title}</span>{o.status === 'completed' && <CheckCircle2 size={14} className={styles.checkIcon} />}</div>
                ))}
              </div>
            )}
            {dayDetails.oneTimeTasks.length > 0 && (
              <div className={styles.detailGroup}><h3 className={styles.detailGroupTitle}>One-time Tasks</h3>
                {dayDetails.oneTimeTasks.map((t) => (
                  <div key={t.id} className={`glass ${styles.detailItem}`}><span className={styles.detailItemText}>{t.title}</span>{t.status === 'completed' && <CheckCircle2 size={14} className={styles.checkIcon} />}</div>
                ))}
              </div>
            )}
            {dayDetails.occurrences.length === 0 && dayDetails.oneTimeTasks.length === 0 && <p className={styles.noData}>No tasks on this date</p>}
          </>
        )}
      </div>
    </div>
  );
}
