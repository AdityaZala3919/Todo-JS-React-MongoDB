import { TaskRepository } from '../repositories/task-repository.js';
import { TimeRepository } from '../repositories/time-repository.js';
import { OccurrenceRepository } from '../repositories/occurrence-repository.js';
import { RecurrenceService } from './recurrence-service.js';
import { Session } from './session.js';
import { today, getWeekStart, getWeekEnd, formatDuration } from '../utils/date.js';

export const StatisticsService = {
  getDailyStats(date) {
    const userId = Session.getCurrentUserId(); if (!userId) return null;
    const targetDate = date || today();
    const totalSeconds = TimeRepository.getTotalForDate(userId, targetDate);
    const allTasks = TaskRepository.getByUser(userId, { excludeStatus: 'archived' });
    const completedToday = allTasks.filter((t) => t.completed_at && t.completed_at.startsWith(targetDate) && t.task_type === 'one_time').length;
    const recurringTasks = TaskRepository.getRecurring(userId);
    let recurringTotal = 0, recurringCompleted = 0;
    for (const task of recurringTasks) { const occ = OccurrenceRepository.getByTaskAndDate(task.id, targetDate); if (occ) { recurringTotal++; if (occ.status === 'completed') recurringCompleted++; } }
    return { date: targetDate, totalTimeSeconds: totalSeconds, totalTimeFormatted: formatDuration(Math.round(totalSeconds / 60)), tasksCompleted: completedToday, recurringTotal, recurringCompleted, recurringRate: recurringTotal > 0 ? Math.round((recurringCompleted / recurringTotal) * 100) : 0 };
  },
  getWeeklyStats(weekStart) {
    const userId = Session.getCurrentUserId(); if (!userId) return null;
    const start = weekStart || getWeekStart(); const end = getWeekEnd(new Date(start));
    const totalSeconds = TimeRepository.getTotalForDateRange(userId, start, end);
    const allTasks = TaskRepository.getByUser(userId, { excludeStatus: 'archived' });
    const completedThisWeek = allTasks.filter((t) => t.completed_at && t.completed_at >= start && t.completed_at <= end + 'T23:59:59' && t.task_type === 'one_time').length;
    return { weekStart: start, weekEnd: end, totalTimeSeconds: totalSeconds, totalTimeFormatted: formatDuration(Math.round(totalSeconds / 60)), tasksCompleted: completedThisWeek, avgDailyTime: formatDuration(Math.round(totalSeconds / 60 / 7)) };
  },
  getTaskStats(taskId) {
    const task = TaskRepository.getById(taskId); if (!task) return null;
    const totalSeconds = TimeRepository.getTotalForTask(taskId);
    const result = { taskId, title: task.title, totalTimeSeconds: totalSeconds, totalTimeFormatted: formatDuration(Math.round(totalSeconds / 60)) };
    if (task.task_type === 'recurring') {
      result.currentStreak = RecurrenceService.getStreak(taskId); result.bestStreak = RecurrenceService.getBestStreak(taskId);
      const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      result.completionRate = RecurrenceService.getCompletionRate(taskId, thirtyDaysAgo.toISOString().split('T')[0], today());
    }
    return result;
  },
  getProductiveTime(date) { const userId = Session.getCurrentUserId(); return userId ? TimeRepository.getTotalForDate(userId, date || today()) : 0; },
  getTodaySessions() { const userId = Session.getCurrentUserId(); return userId ? TimeRepository.getByUserAndDate(userId, today()) : []; },
};
