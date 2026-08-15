import { MemoryDb } from '../services/memory-db.js';
import { generateId } from '../utils/uuid.js';
import { now } from '../utils/date.js';

export const TagRepository = {
  create(data) {
    const id = generateId();
    const tag = { id, user_id: data.user_id, name: data.name.trim().toLowerCase(), color: data.color || '#6b7280', created_at: now() };
    MemoryDb.tags.push(tag); MemoryDb.sync('tags', 'insert', tag); return tag;
  },
  getById(id) { return MemoryDb.tags.find((t) => t.id === id) || null; },
  getByUser(userId) { return MemoryDb.tags.filter((t) => t.user_id === userId).sort((a, b) => a.name.localeCompare(b.name)); },
  findByName(userId, name) { const ln = name.trim().toLowerCase(); return MemoryDb.tags.find((t) => t.user_id === userId && t.name === ln) || null; },
  update(id, fields) {
    const tag = MemoryDb.tags.find((t) => t.id === id); if (!tag) return;
    const allowed = ['name', 'color']; const updatedFields = {};
    for (const [key, value] of Object.entries(fields)) { if (allowed.includes(key)) { const val = key === 'name' ? value.trim().toLowerCase() : value; tag[key] = val; updatedFields[key] = val; } }
    MemoryDb.sync('tags', 'update', { id, ...updatedFields });
  },
  delete(id) {
    const index = MemoryDb.tags.findIndex((t) => t.id === id);
    if (index !== -1) {
      MemoryDb.tags.splice(index, 1); MemoryDb.sync('tags', 'delete', { id });
      for (const tt of MemoryDb.task_tags.filter((x) => x.tag_id === id)) {
        const ji = MemoryDb.task_tags.indexOf(tt); MemoryDb.task_tags.splice(ji, 1);
        MemoryDb.sync('task_tags', 'delete', { task_id: tt.task_id, tag_id: tt.tag_id });
      }
    }
  },
  getTagsForTask(taskId) {
    const tagIds = MemoryDb.task_tags.filter((tt) => tt.task_id === taskId).map((tt) => tt.tag_id);
    return MemoryDb.tags.filter((t) => tagIds.includes(t.id)).sort((a, b) => a.name.localeCompare(b.name));
  },
  setTaskTags(taskId, tagIds) {
    for (const tt of MemoryDb.task_tags.filter((x) => x.task_id === taskId)) {
      const idx = MemoryDb.task_tags.indexOf(tt); MemoryDb.task_tags.splice(idx, 1);
      MemoryDb.sync('task_tags', 'delete', { task_id: tt.task_id, tag_id: tt.tag_id });
    }
    for (const tagId of tagIds) {
      const mapping = { task_id: taskId, tag_id: tagId }; MemoryDb.task_tags.push(mapping); MemoryDb.sync('task_tags', 'insert', mapping);
    }
  },
  addTagToTask(taskId, tagId) {
    if (!MemoryDb.task_tags.some((tt) => tt.task_id === taskId && tt.tag_id === tagId)) {
      const mapping = { task_id: taskId, tag_id: tagId }; MemoryDb.task_tags.push(mapping); MemoryDb.sync('task_tags', 'insert', mapping);
    }
  },
  removeTagFromTask(taskId, tagId) {
    const index = MemoryDb.task_tags.findIndex((tt) => tt.task_id === taskId && tt.tag_id === tagId);
    if (index !== -1) { MemoryDb.task_tags.splice(index, 1); MemoryDb.sync('task_tags', 'delete', { task_id: taskId, tag_id: tagId }); }
  },
};
