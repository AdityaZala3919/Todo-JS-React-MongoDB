import { create } from 'zustand';
import { TaskService } from '../services/task-service.js';

export const useTaskStore = create((set, get) => ({
  refreshKey: 0,

  refresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),

  getTodaysTasks: () => TaskService.getTodaysTasks(),
  getAllTasks: (filters) => TaskService.getAllTasks(filters),
  getOverdueTasks: () => TaskService.getOverdueTasks(),
  searchTasks: (query) => TaskService.searchTasks(query),

  createOneTimeTask: (data) => { const task = TaskService.createOneTimeTask(data); get().refresh(); return task; },
  createRecurringTask: (data) => { const task = TaskService.createRecurringTask(data); get().refresh(); return task; },
  updateTask: (id, data) => { TaskService.updateTask(id, data); get().refresh(); },
  toggleCompletion: (taskId, occId) => { TaskService.toggleCompletion(taskId, occId); get().refresh(); },
  archiveTask: (taskId) => { TaskService.archiveTask(taskId); get().refresh(); },
  restoreTask: (taskId) => { TaskService.restoreTask(taskId); get().refresh(); },
  deleteTask: (taskId) => { TaskService.deleteTask(taskId); get().refresh(); },
}));
