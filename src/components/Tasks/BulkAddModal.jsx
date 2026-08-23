import { useState, useMemo } from 'react';
import { X, ListPlus, CheckSquare } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';
import { TagRepository } from '../../repositories/tag-repository';
import { ProjectRepository } from '../../repositories/project-repository';
import { Session } from '../../services/session';
import { toast } from '../UI/Toast';
import styles from './BulkAddModal.module.css';

export default function BulkAddModal({ onClose }) {
  const { createBulkTasks } = useTaskStore();
  const [rawText, setRawText] = useState('');
  const [priority, setPriority] = useState('medium');
  const [taskType, setTaskType] = useState('one_time');
  const [projectId, setProjectId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [deadline, setDeadline] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');

  const userId = Session.getCurrentUserId();
  const projects = userId ? ProjectRepository.getByUser(userId) : [];
  const tags = userId ? TagRepository.getByUser(userId) : [];

  // Clean lines into list of task titles
  const parsedTasks = useMemo(() => {
    return rawText
      .split('\n')
      .map((line) => line.replace(/^[\s•\-\*\d\.\)\(\]]+/, '').trim())
      .filter((line) => line.length > 0);
  }, [rawText]);

  const toggleTag = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (parsedTasks.length === 0) {
      toast.error('Please enter at least one task');
      return;
    }
    try {
      const taskList = parsedTasks.map((title) => {
        const item = {
          title,
          task_type: taskType,
          priority: priority || 'medium',
          project_id: projectId || undefined,
          tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        };
        if (taskType === 'one_time') {
          if (deadline) item.deadline = deadline;
          if (estimatedDuration) item.estimated_duration = Number(estimatedDuration);
        } else {
          item.frequency = 'daily';
          if (estimatedDuration) item.min_duration = Number(estimatedDuration);
        }
        return item;
      });

      createBulkTasks(taskList);
      toast.success(`Successfully created ${parsedTasks.length} tasks!`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create tasks');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <div className={styles.iconBadge}>
              <ListPlus size={18} />
            </div>
            <div>
              <h2>Bulk Add Tasks</h2>
              <p className={styles.subtitle}>Enter or paste a list — one task per line</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleCreate} className={styles.form}>
          <div className={styles.typeToggle}>
            <button
              type="button"
              className={`${styles.typeBtn} ${taskType === 'one_time' ? styles.typeActive : ''}`}
              onClick={() => setTaskType('one_time')}
            >
              One-time Tasks
            </button>
            <button
              type="button"
              className={`${styles.typeBtn} ${taskType === 'recurring' ? styles.typeActive : ''}`}
              onClick={() => setTaskType('recurring')}
            >
              Recurring Tasks
            </button>
          </div>

          <div className={styles.field}>
            <div className={styles.fieldHeader}>
              <label className={styles.label}>Task List</label>
              <span className={styles.countBadge}>
                {parsedTasks.length} {parsedTasks.length === 1 ? 'task' : 'tasks'} detected
              </span>
            </div>
            <textarea
              className={`input ${styles.textarea}`}
              placeholder={"e.g.\n1. Review project documentation\n2. Fix responsive navbar bug\n3. Submit weekly progress report"}
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              autoFocus
            />
          </div>

          {/* Quick Preview Chips */}
          {parsedTasks.length > 0 && (
            <div className={styles.previewBox}>
              <span className={styles.previewTitle}>Preview ({parsedTasks.length}):</span>
              <div className={styles.previewList}>
                {parsedTasks.slice(0, 4).map((t, idx) => (
                  <div key={idx} className={styles.previewItem}>
                    <CheckSquare size={12} className={styles.checkIcon} />
                    <span>{t}</span>
                  </div>
                ))}
                {parsedTasks.length > 4 && (
                  <span className={styles.moreCount}>+ {parsedTasks.length - 4} more...</span>
                )}
              </div>
            </div>
          )}

          {/* Default properties */}
          <div className={styles.sectionDivider}>
            <span>Default Properties For All Tasks</span>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Priority</label>
              <select
                className="input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {projects.length > 0 && (
              <div className={styles.field}>
                <label className={styles.label}>Project</label>
                <select
                  className="input"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">No Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {taskType === 'one_time' && (
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Deadline</label>
                <input
                  type="date"
                  className="input"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Est. Duration (min)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="30"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  min="0"
                />
              </div>
            </div>
          )}

          {tags.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>Tags</label>
              <div className={styles.tagPicker}>
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className={`${styles.tagBtn} ${
                      selectedTagIds.includes(tag.id) ? styles.tagActive : ''
                    }`}
                    onClick={() => toggleTag(tag.id)}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={parsedTasks.length === 0}
            >
              <ListPlus size={15} />
              {parsedTasks.length > 0 ? `Create ${parsedTasks.length} Tasks` : 'Create Tasks'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { BulkAddModal };
