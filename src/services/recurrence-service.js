import { OccurrenceRepository } from '../repositories/occurrence-repository.js';
import { RecurrenceRepository } from '../repositories/recurrence-repository.js';
import { TimeRepository } from '../repositories/time-repository.js';
import { today, getDayOfWeek } from '../utils/date.js';

export const RecurrenceService = {
  isTaskDueOn(rule, dateStr) {
    if (!rule) return false;
    const dayOfWeek = getDayOfWeek(dateStr);
    switch (rule.frequency) {
      case 'daily':
        return true;
      case 'weekly': {
        let days = rule.days_of_week;
        if (typeof days === 'string') {
          try { days = JSON.parse(days); } catch { days = null; }
        }
        if (Array.isArray(days) && days.length > 0) {
          return days.map(Number).includes(dayOfWeek);
        }
        const creationDay = getDayOfWeek(rule.created_at || today());
        return dayOfWeek === creationDay;
      }
      case 'selected_days': {
        let days = rule.days_of_week;
        if (typeof days === 'string') {
          try { days = JSON.parse(days); } catch { return false; }
        }
        return Array.isArray(days) && days.map(Number).includes(dayOfWeek);
      }
      default:
        return false;
    }
  },
  ensureOccurrence(taskId, dateStr) {
    let occ = OccurrenceRepository.getByTaskAndDate(taskId, dateStr);
    if (!occ) occ = OccurrenceRepository.create({ task_id: taskId, occurrence_date: dateStr });
    return occ;
  },
  getStreak(taskId) {
    const rule = RecurrenceRepository.getByTaskId(taskId); if (!rule) return 0;
    const occurrences = OccurrenceRepository.getCompletionHistory(taskId); if (occurrences.length === 0) return 0;
    const todayStr = today(); let streak = 0; let checkDate = new Date(todayStr);
    const todayOcc = occurrences.find((o) => o.occurrence_date === todayStr);
    if (todayOcc && todayOcc.status === 'completed') { streak = 1; checkDate.setDate(checkDate.getDate() - 1); } else { checkDate.setDate(checkDate.getDate() - 1); }
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (this.isTaskDueOn(rule, dateStr)) { const occ = occurrences.find((o) => o.occurrence_date === dateStr); if (occ && occ.status === 'completed') streak++; else break; }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  },
  getBestStreak(taskId) {
    const rule = RecurrenceRepository.getByTaskId(taskId); if (!rule) return 0;
    const occurrences = OccurrenceRepository.getCompletionHistory(taskId); if (occurrences.length === 0) return 0;
    const sorted = [...occurrences].sort((a, b) => a.occurrence_date.localeCompare(b.occurrence_date));
    let best = 0, current = 0;
    for (const occ of sorted) { if (occ.status === 'completed') { current++; best = Math.max(best, current); } else { current = 0; } }
    return best;
  },
  getCompletionRate(taskId, startDate, endDate) {
    const total = OccurrenceRepository.countTotal(taskId, startDate, endDate); if (total === 0) return 0;
    return Math.round((OccurrenceRepository.countCompleted(taskId, startDate, endDate) / total) * 100);
  },
  getTodayProgress(taskId) {
    const rule = RecurrenceRepository.getByTaskId(taskId); const todayStr = today();
    const occ = OccurrenceRepository.getByTaskAndDate(taskId, todayStr);
    const target = rule?.min_duration || 0; let current = 0;
    if (occ) { current = Math.round(TimeRepository.getTotalForOccurrence(occ.id) / 60); }
    return { current, target, percentage: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0 };
  },
};
