import { useState } from 'react';
import { X } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';
import { TagRepository } from '../../repositories/tag-repository';
import { ProjectRepository } from '../../repositories/project-repository';
import { Session } from '../../services/session';
import { toast } from '../UI/Toast';
import styles from './TaskForm.module.css';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TaskForm({ task, onClose }) {
  const isEdit = !!task;
  const { createOneTimeTask, createRecurringTask, updateTask } = useTaskStore();

  const [formData, setFormData] = useState({
    title: task?.title || '', description: task?.description || '', task_type: task?.task_type || 'one_time',
    priority: task?.priority || 'medium', deadline: task?.deadline?.split('T')[0] || '',
    estimated_duration: task?.estimated_duration || '', frequency: task?.frequency || 'daily',
    days_of_week: task?.days_of_week || task?.rule?.days_of_week || [], min_duration: task?.min_duration || task?.rule?.min_duration || '',
    project_id: task?.project_id || '', tagIds: task?.tags?.map((t) => t.id) || [],
  });

  const userId = Session.getCurrentUserId();
  const projects = userId ? ProjectRepository.getByUser(userId) : [];
  const tags = userId ? TagRepository.getByUser(userId) : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      if (data.estimated_duration) data.estimated_duration = Number(data.estimated_duration);
      if (data.min_duration) data.min_duration = Number(data.min_duration);
      if (isEdit) { updateTask(task.id, data); toast.success('Task updated'); }
      else if (data.task_type === 'recurring') { createRecurringTask(data); toast.success('Recurring task created'); }
      else { createOneTimeTask(data); toast.success('Task created'); }
      onClose();
    } catch (err) { toast.error(err.message); }
  };

  const set = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const toggleDay = (day) => set('days_of_week', formData.days_of_week.includes(day) ? formData.days_of_week.filter((d) => d !== day) : [...formData.days_of_week, day]);
  const toggleTag = (tagId) => set('tagIds', formData.tagIds.includes(tagId) ? formData.tagIds.filter((id) => id !== tagId) : [...formData.tagIds, tagId]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.typeToggle}>
            <button type="button" className={`${styles.typeBtn} ${formData.task_type === 'one_time' ? styles.typeActive : ''}`} onClick={() => set('task_type', 'one_time')}>One-time</button>
            <button type="button" className={`${styles.typeBtn} ${formData.task_type === 'recurring' ? styles.typeActive : ''}`} onClick={() => set('task_type', 'recurring')}>Recurring</button>
          </div>
          <input className="input" placeholder="Task title" value={formData.title} onChange={(e) => set('title', e.target.value)} required autoFocus />
          <textarea className="input" placeholder="Description (optional)" rows={2} value={formData.description} onChange={(e) => set('description', e.target.value)} style={{ resize: 'vertical' }} />
          <div className={styles.row}>
            <select className="input" value={formData.priority} onChange={(e) => set('priority', e.target.value)}>
              <option value="low">Low Priority</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
            </select>
            {projects.length > 0 && (
              <select className="input" value={formData.project_id} onChange={(e) => set('project_id', e.target.value)}>
                <option value="">No Project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>
          {formData.task_type === 'one_time' && (
            <div className={styles.row}>
              <div className={styles.field}><label className={styles.label}>Deadline</label><input type="date" className="input" value={formData.deadline} onChange={(e) => set('deadline', e.target.value)} /></div>
              <div className={styles.field}><label className={styles.label}>Estimated (min)</label><input type="number" className="input" placeholder="60" value={formData.estimated_duration} onChange={(e) => set('estimated_duration', e.target.value)} min="0" /></div>
            </div>
          )}
          {formData.task_type === 'recurring' && (
            <>
              <select className="input" value={formData.frequency} onChange={(e) => set('frequency', e.target.value)}>
                <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="selected_days">Selected Days</option>
              </select>
              {formData.frequency === 'selected_days' && (
                <div className={styles.dayPicker}>{DAY_LABELS.map((label, i) => (
                  <button key={i} type="button" className={`${styles.dayBtn} ${formData.days_of_week.includes(i) ? styles.dayActive : ''}`} onClick={() => toggleDay(i)}>{label}</button>
                ))}</div>
              )}
              <div className={styles.field}><label className={styles.label}>Min duration (min)</label><input type="number" className="input" placeholder="60" value={formData.min_duration} onChange={(e) => set('min_duration', e.target.value)} min="1" /></div>
            </>
          )}
          {tags.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>Tags</label>
              <div className={styles.tagPicker}>{tags.map((tag) => (
                <button key={tag.id} type="button" className={`${styles.tagBtn} ${formData.tagIds.includes(tag.id) ? styles.tagActive : ''}`} onClick={() => toggleTag(tag.id)}>#{tag.name}</button>
              ))}</div>
            </div>
          )}
          <div className={styles.actions}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{isEdit ? 'Save Changes' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
