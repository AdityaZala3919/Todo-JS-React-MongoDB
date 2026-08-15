import { MemoryDb } from '../services/memory-db.js';
import { generateId } from '../utils/uuid.js';
import { now } from '../utils/date.js';

export const ProjectRepository = {
  create(data) {
    const id = generateId(); const timestamp = now();
    const project = { id, user_id: data.user_id, name: data.name.trim(), color: data.color || '#14b8a6', icon: data.icon || 'folder', is_archived: 0, sort_order: data.sort_order || 0, created_at: timestamp, updated_at: timestamp };
    MemoryDb.projects.push(project); MemoryDb.sync('projects', 'insert', project); return project;
  },
  getById(id) { return MemoryDb.projects.find((p) => p.id === id) || null; },
  getByUser(userId, includeArchived = false) {
    return MemoryDb.projects.filter((p) => p.user_id === userId && (includeArchived || p.is_archived === 0))
      .sort((a, b) => { if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order; return a.name.localeCompare(b.name); });
  },
  update(id, fields) {
    const project = MemoryDb.projects.find((p) => p.id === id); if (!project) return;
    const allowed = ['name', 'color', 'icon', 'is_archived', 'sort_order']; const updatedFields = {};
    for (const [key, value] of Object.entries(fields)) { if (allowed.includes(key)) { project[key] = value; updatedFields[key] = value; } }
    project.updated_at = now(); updatedFields.updated_at = project.updated_at;
    MemoryDb.sync('projects', 'update', { id, ...updatedFields });
  },
  archive(id) { this.update(id, { is_archived: 1 }); },
  delete(id) {
    const index = MemoryDb.projects.findIndex((p) => p.id === id);
    if (index !== -1) {
      MemoryDb.projects.splice(index, 1); MemoryDb.sync('projects', 'delete', { id });
      for (const task of MemoryDb.tasks.filter((t) => t.project_id === id)) { task.project_id = null; MemoryDb.sync('tasks', 'update', { id: task.id, project_id: null }); }
    }
  },
  getTaskCount(projectId) { return MemoryDb.tasks.filter((t) => t.project_id === projectId && t.status !== 'archived').length; },
};
