import { TaskRepository } from '../repositories/task-repository.js';
import { RecurrenceRepository } from '../repositories/recurrence-repository.js';
import { OccurrenceRepository } from '../repositories/occurrence-repository.js';
import { TagRepository } from '../repositories/tag-repository.js';
import { Session } from './session.js';
import { EventBus, Events } from './events.js';
import { validateTask } from '../utils/validation.js';
import { today, now, isToday, getDayOfWeek } from '../utils/date.js';

export const TaskService = {
  createOneTimeTask(data) {
    const userId = Session.getCurrentUserId(); if (!userId) throw new Error('Not logged in');
    data.task_type = 'one_time';
    const validation = validateTask(data); if (!validation.valid) throw new Error(Object.values(validation.errors)[0]);
    const task = TaskRepository.create({ ...data, user_id: userId });
    if (data.tagIds && data.tagIds.length > 0) TagRepository.setTaskTags(task.id, data.tagIds);
    EventBus.emit(Events.TASK_CREATED, task); return task;
  },
  createRecurringTask(data) {
    const userId = Session.getCurrentUserId(); if (!userId) throw new Error('Not logged in');
    data.task_type = 'recurring';
    const validation = validateTask(data); if (!validation.valid) throw new Error(Object.values(validation.errors)[0]);
    const task = TaskRepository.create({ ...data, user_id: userId });
    const rule = RecurrenceRepository.create({ task_id: task.id, frequency: data.frequency, days_of_week: data.days_of_week || null, min_duration: data.min_duration || null, min_count: data.min_count || null });
    if (data.tagIds && data.tagIds.length > 0) TagRepository.setTaskTags(task.id, data.tagIds);
    const todayStr = today();
    if (this._isTaskDueOn(data, todayStr)) OccurrenceRepository.create({ task_id: task.id, occurrence_date: todayStr });
    EventBus.emit(Events.TASK_CREATED, { ...task, rule }); return { ...task, rule };
  },
  updateTask(taskId, data) {
    const task = TaskRepository.getById(taskId); if (!task) throw new Error('Task not found');
    TaskRepository.update(taskId, data);
    if (data.tagIds !== undefined) TagRepository.setTaskTags(taskId, data.tagIds);
    if (task.task_type === 'recurring' && (data.frequency || data.days_of_week || data.min_duration !== undefined)) {
      const rule = RecurrenceRepository.getByTaskId(taskId);
      if (rule) { const ruleUpdate = {}; if (data.frequency) ruleUpdate.frequency = data.frequency; if (data.days_of_week) ruleUpdate.days_of_week = data.days_of_week; if (data.min_duration !== undefined) ruleUpdate.min_duration = data.min_duration; if (data.min_count !== undefined) ruleUpdate.min_count = data.min_count; RecurrenceRepository.update(rule.id, ruleUpdate); }
    }
    EventBus.emit(Events.TASK_UPDATED, TaskRepository.getById(taskId));
  },
  completeOneTimeTask(taskId) { TaskRepository.update(taskId, { status: 'completed', completed_at: now() }); EventBus.emit(Events.TASK_COMPLETED, TaskRepository.getById(taskId)); },
  uncompleteOneTimeTask(taskId) { TaskRepository.update(taskId, { status: 'pending', completed_at: null }); EventBus.emit(Events.TASK_UPDATED, TaskRepository.getById(taskId)); },
  toggleCompletion(taskId, occurrenceId) {
    const task = TaskRepository.getById(taskId); if (!task) throw new Error('Task not found');
    if (task.task_type === 'one_time') { task.status === 'completed' ? this.uncompleteOneTimeTask(taskId) : this.completeOneTimeTask(taskId); }
    else if (task.task_type === 'recurring' && occurrenceId) {
      const occ = OccurrenceRepository.getById(occurrenceId); if (!occ) throw new Error('Occurrence not found');
      occ.status === 'completed' ? OccurrenceRepository.update(occurrenceId, { status: 'pending', completed_at: null }) : OccurrenceRepository.update(occurrenceId, { status: 'completed', completed_at: now() });
      EventBus.emit(Events.OCCURRENCE_UPDATED, OccurrenceRepository.getById(occurrenceId));
    }
  },
  archiveTask(taskId) { const task = TaskRepository.getById(taskId); if (!task) throw new Error('Task not found'); TaskRepository.archive(taskId); EventBus.emit(Events.TASK_ARCHIVED, task); return task; },
  restoreTask(taskId) { TaskRepository.update(taskId, { status: 'pending' }); EventBus.emit(Events.TASK_UPDATED, TaskRepository.getById(taskId)); },
  deleteTask(taskId) { const task = TaskRepository.getById(taskId); if (!task) throw new Error('Task not found'); TaskRepository.delete(taskId); EventBus.emit(Events.TASK_DELETED, task); return task; },
  getTodaysTasks() {
    const userId = Session.getCurrentUserId(); if (!userId) return { oneTime: [], recurring: [] };
    const todayStr = today();
    const allOneTime = TaskRepository.getByUser(userId, { task_type: 'one_time', excludeStatus: 'archived', sort: 'priority' });
    const oneTime = allOneTime.filter((task) => {
      // Incomplete tasks remain on the dashboard
      if (task.status !== 'completed') return true;
      // Completed tasks only appear on the dashboard if completed today
      return Boolean(task.completed_at && isToday(task.completed_at));
    });
    const recurringTasks = TaskRepository.getRecurring(userId);
    const recurring = recurringTasks.map((task) => {
      const isDueToday = this._isTaskDueOn(task, todayStr);
      let occurrence = OccurrenceRepository.getByTaskAndDate(task.id, todayStr);
      if (!occurrence && isDueToday) {
        occurrence = OccurrenceRepository.create({ task_id: task.id, occurrence_date: todayStr });
      }
      if (!isDueToday && (!occurrence || occurrence.status !== 'completed')) {
        occurrence = null;
      }
      const tags = TagRepository.getTagsForTask(task.id);
      return { ...task, occurrence, tags };
    }).filter((t) => t.occurrence);
    const enrichedOneTime = oneTime.map((task) => ({ ...task, tags: TagRepository.getTagsForTask(task.id) }));
    return { oneTime: enrichedOneTime, recurring };
  },
  getAllTasks(filters = {}) {
    const userId = Session.getCurrentUserId(); if (!userId) return [];
    return TaskRepository.getByUser(userId, filters).map((task) => {
      const tags = TagRepository.getTagsForTask(task.id); let rule = null, todayOccurrence = null;
      if (task.task_type === 'recurring') { rule = RecurrenceRepository.getByTaskId(task.id); todayOccurrence = OccurrenceRepository.getByTaskAndDate(task.id, today()); }
      return { ...task, tags, rule, todayOccurrence };
    });
  },
  getOverdueTasks() { const userId = Session.getCurrentUserId(); return userId ? TaskRepository.getOverdue(userId) : []; },
  searchTasks(query) { const userId = Session.getCurrentUserId(); return userId ? TaskRepository.search(userId, query) : []; },
  _isTaskDueOn(taskOrData, dateStr) {
    if (!taskOrData) return false;
    const freq = taskOrData.frequency;
    if (!freq) return false;
    if (freq === 'daily') return true;

    const dayOfWeek = getDayOfWeek(dateStr);

    if (freq === 'selected_days') {
      let days = taskOrData.days_of_week;
      if (typeof days === 'string') {
        try { days = JSON.parse(days); } catch { return false; }
      }
      if (Array.isArray(days)) {
        return days.map(Number).includes(dayOfWeek);
      }
      return false;
    }

    if (freq === 'weekly') {
      let days = taskOrData.days_of_week;
      if (typeof days === 'string') {
        try { days = JSON.parse(days); } catch { days = null; }
      }
      if (Array.isArray(days) && days.length > 0) {
        return days.map(Number).includes(dayOfWeek);
      }
      const creationDay = getDayOfWeek(taskOrData.created_at || taskOrData.start_date || today());
      return dayOfWeek === creationDay;
    }

    return false;
  },
  updateSortOrders(items) { TaskRepository.updateSortOrders(items); },
};
