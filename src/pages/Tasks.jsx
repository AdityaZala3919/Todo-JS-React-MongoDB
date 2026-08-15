import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Play, Edit3, Archive, RotateCcw, Trash2, Inbox } from 'lucide-react';
import { useTaskStore } from '../stores/taskStore';
import { useTimerStore } from '../stores/timerStore';
import { formatDate, formatDuration } from '../utils/date';
import { toast } from '../components/UI/Toast';
import TaskForm from '../components/Tasks/TaskForm';
import styles from './Tasks.module.css';

export default function Tasks({ onNewTask }) {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const { refreshKey, toggleCompletion, archiveTask, restoreTask, deleteTask } = useTaskStore();
  const timer = useTimerStore();
  const [tab, setTab] = useState('active');
  const [editTask, setEditTask] = useState(null);
  const [filter, setFilter] = useState({ type: '', priority: '' });

  const tasks = useMemo(() => {
    let filters = {};
    if (tab === 'active') filters.excludeStatus = ['completed', 'archived'];
    else if (tab === 'completed') filters.status = 'completed';
    else if (tab === 'archived') filters.status = 'archived';
    if (filter.type) filters.task_type = filter.type;
    if (filter.priority) filters.priority = filter.priority;
    let list = searchQuery ? useTaskStore.getState().searchTasks(searchQuery) : useTaskStore.getState().getAllTasks(filters);
    return list;
  }, [refreshKey, tab, filter, searchQuery]);

  const handleToggle = (t) => toggleCompletion(t.id, t.task_type === 'recurring' ? t.todayOccurrence?.id : undefined);
  const handleArchive = (t) => { archiveTask(t.id); toast.success('Archived', { label: 'Undo', fn: () => restoreTask(t.id) }); };
  const handleRestore = (t) => { restoreTask(t.id); toast.success('Restored'); };
  const handleDelete = (t) => { deleteTask(t.id); toast.success('Deleted'); };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tasks</h1>
        {searchQuery && <span className={styles.searchTag}>Results for "{searchQuery}"</span>}
      </div>
      <div className={styles.controls}>
        <div className={styles.tabs}>
          {['active', 'completed', 'archived'].map((t) => (
            <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
        <div className={styles.filters}>
          <select className={styles.filterSelect} value={filter.type} onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}>
            <option value="">All types</option><option value="one_time">One-time</option><option value="recurring">Recurring</option>
          </select>
          <select className={styles.filterSelect} value={filter.priority} onChange={(e) => setFilter((f) => ({ ...f, priority: e.target.value }))}>
            <option value="">All priorities</option><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
        </div>
      </div>
      <div className={styles.list}>
        {tasks.map((t) => {
          const isCompleted = t.task_type === 'recurring' ? t.todayOccurrence?.status === 'completed' : t.status === 'completed';
          const isArchived = t.status === 'archived';
          return (
            <div key={t.id} className={`${styles.item} glass ${isCompleted ? styles.completed : ''}`}>
              {tab !== 'archived' && (
                <button className={`${styles.checkbox} ${isCompleted ? styles.checked : ''}`} onClick={() => handleToggle(t)}>
                  {isCompleted && <CheckCircle2 size={14} />}
                </button>
              )}
              <div className={styles.itemMain}>
                <span className={`${styles.itemTitle} ${isCompleted ? styles.strikethrough : ''}`}>{t.title}</span>
                {t.description && <p className={styles.itemDesc}>{t.description}</p>}
                <div className={styles.itemMeta}>
                  <span className={`${styles.priorityBadge} ${styles[`pr_${t.priority}`]}`}>{t.priority}</span>
                  <span className={styles.typeBadge}>{t.task_type === 'recurring' ? '🔁' : '📌'}</span>
                  {t.deadline && <span className={styles.metaText}>{formatDate(t.deadline, { short: true })}</span>}
                  {t.estimated_duration && <span className={styles.metaText}>{formatDuration(t.estimated_duration)}</span>}
                </div>
              </div>
              <div className={styles.itemActions}>
                {!isArchived && (
                  <>
                    <button className={styles.actionBtn} onClick={() => timer.start(t.id, t.todayOccurrence?.id)} title="Timer"><Play size={13} /></button>
                    <button className={styles.actionBtn} onClick={() => setEditTask(t)} title="Edit"><Edit3 size={13} /></button>
                    <button className={styles.actionBtn} onClick={() => handleArchive(t)} title="Archive"><Archive size={13} /></button>
                  </>
                )}
                {isArchived && (
                  <>
                    <button className={styles.actionBtn} onClick={() => handleRestore(t)} title="Restore"><RotateCcw size={13} /></button>
                    <button className={styles.actionBtn} onClick={() => handleDelete(t)} title="Delete"><Trash2 size={13} /></button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && <div className={styles.empty}><Inbox size={40} strokeWidth={1} /><p>No tasks found</p></div>}
      </div>
      {editTask && <TaskForm task={editTask} onClose={() => setEditTask(null)} />}
    </div>
  );
}
