import { create } from 'zustand';
import { TaskService } from '../services/task-service.js';
import { EventBus, Events } from '../services/events.js';

export const useTaskStore = create((set, get) => {
  // Automatically refresh components whenever data is loaded, imported, or login occurs
  EventBus.on(Events.DATA_IMPORTED, () => set((s) => ({ refreshKey: s.refreshKey + 1 })));
  EventBus.on(Events.AUTH_LOGIN, () => set((s) => ({ refreshKey: s.refreshKey + 1 })));

  return {
    refreshKey: 0,

    refresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),

    getTodaysTasks: () => TaskService.getTodaysTasks(),
    getAllTasks: (filters) => TaskService.getAllTasks(filters),
    getOverdueTasks: () => TaskService.getOverdueTasks(),
    searchTasks: (query) => TaskService.searchTasks(query),

    createOneTimeTask: (data) => { const task = TaskService.createOneTimeTask(data); get().refresh(); return task; },
    createRecurringTask: (data) => { const task = TaskService.createRecurringTask(data); get().refresh(); return task; },
    createBulkTasks: (tasks) => {
      const created = [];
      for (const item of tasks) {
        if (item.task_type === 'recurring') {
          created.push(TaskService.createRecurringTask(item));
        } else {
          created.push(TaskService.createOneTimeTask(item));
        }
      }
      get().refresh();
      return created;
    },
    updateTask: (id, data) => { TaskService.updateTask(id, data); get().refresh(); },
    toggleCompletion: (taskId, occId) => { TaskService.toggleCompletion(taskId, occId); get().refresh(); },
    archiveTask: (taskId) => { TaskService.archiveTask(taskId); get().refresh(); },
    restoreTask: (taskId) => { TaskService.restoreTask(taskId); get().refresh(); },
    deleteTask: (taskId) => { TaskService.deleteTask(taskId); get().refresh(); },
  };
});
