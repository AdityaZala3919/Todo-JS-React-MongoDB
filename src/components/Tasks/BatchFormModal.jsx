import { useState } from 'react';
import { X, Layers, Plus, Trash2, Copy, Sparkles } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';
import { TagRepository } from '../../repositories/tag-repository';
import { ProjectRepository } from '../../repositories/project-repository';
import { Session } from '../../services/session';
import { toast } from '../UI/Toast';
import styles from './BatchFormModal.module.css';

const DEFAULT_ROW = {
  id: 1,
  title: '',
  priority: 'medium',
  estimated_duration: '',
  deadline: '',
  project_id: '',
};

export default function BatchFormModal({ onClose }) {
  const { createBulkTasks } = useTaskStore();
  const [rows, setRows] = useState([
    { ...DEFAULT_ROW, id: Date.now() },
    { ...DEFAULT_ROW, id: Date.now() + 1 },
    { ...DEFAULT_ROW, id: Date.now() + 2 }
  ]);

  const userId = Session.getCurrentUserId();
  const projects = userId ? ProjectRepository.getByUser(userId) : [];

  const handleAddRow = () => {
    setRows((prev) => [...prev, { ...DEFAULT_ROW, id: Date.now() + Math.random() }]);
  };

  const handleDuplicateRow = (index) => {
    const target = rows[index];
    const newRow = { ...target, id: Date.now() + Math.random() };
    const nextRows = [...rows];
    nextRows.splice(index + 1, 0, newRow);
    setRows(nextRows);
  };

  const handleRemoveRow = (id) => {
    if (rows.length <= 1) {
      toast.error('You need at least one task row');
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const validCount = rows.filter((r) => r.title.trim().length > 0).length;

  const handleSubmit = (e) => {
    e.preventDefault();
    const validRows = rows.filter((r) => r.title.trim().length > 0);
    if (validRows.length === 0) {
      toast.error('Please enter a title for at least one task');
      return;
    }
    try {
      const taskList = validRows.map((r) => {
        const item = {
          title: r.title.trim(),
          task_type: 'one_time',
          priority: r.priority || 'medium',
          project_id: r.project_id || undefined,
        };
        if (r.estimated_duration) item.estimated_duration = Number(r.estimated_duration);
        if (r.deadline) item.deadline = r.deadline;
        return item;
      });

      createBulkTasks(taskList);
      toast.success(`Successfully created ${validRows.length} tasks!`);
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
              <Layers size={18} />
            </div>
            <div>
              <h2>Batch Task Creator</h2>
              <p className={styles.subtitle}>Define multiple structured tasks with custom options</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.tableHeader}>
            <span className={styles.colTitle}>Task Title</span>
            <span className={styles.colPriority}>Priority</span>
            <span className={styles.colDuration}>Est. Min</span>
            {projects.length > 0 && <span className={styles.colProject}>Project</span>}
            <span className={styles.colActions}>Actions</span>
          </div>

          <div className={styles.rowList}>
            {rows.map((row, index) => (
              <div key={row.id} className={styles.taskRow}>
                <div className={styles.rowNumber}>{index + 1}</div>
                <input
                  type="text"
                  className={`input ${styles.titleInput}`}
                  placeholder="Task title..."
                  value={row.title}
                  onChange={(e) => updateRow(row.id, 'title', e.target.value)}
                  autoFocus={index === 0}
                />
                <select
                  className={`input ${styles.prioritySelect}`}
                  value={row.priority}
                  onChange={(e) => updateRow(row.id, 'priority', e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Med</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <input
                  type="number"
                  className={`input ${styles.durationInput}`}
                  placeholder="30"
                  value={row.estimated_duration}
                  onChange={(e) => updateRow(row.id, 'estimated_duration', e.target.value)}
                  min="0"
                />
                {projects.length > 0 && (
                  <select
                    className={`input ${styles.projectSelect}`}
                    value={row.project_id}
                    onChange={(e) => updateRow(row.id, 'project_id', e.target.value)}
                  >
                    <option value="">None</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
                <div className={styles.rowButtons}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => handleDuplicateRow(index)}
                    title="Duplicate row"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${styles.deleteBtn}`}
                    onClick={() => handleRemoveRow(row.id)}
                    title="Remove row"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.rowControls}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleAddRow}
            >
              <Plus size={14} /> Add Another Task Row
            </button>
            <span className={styles.validStatus}>
              {validCount} of {rows.length} valid
            </span>
          </div>

          <div className={styles.actions}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={validCount === 0}
            >
              <Layers size={15} />
              Create {validCount > 0 ? `${validCount} Tasks` : 'Tasks'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
