import { MemoryDb } from '../services/memory-db.js';
import { generateId } from '../utils/uuid.js';
import { now } from '../utils/date.js';

export const VisitLaterRepository = {
  create(data) {
    const id = data.id || generateId();
    const timestamp = now();
    const item = {
      id,
      user_id: data.user_id,
      url: data.url ? data.url.trim() : '',
      title: data.title ? data.title.trim() : '',
      category: data.category || 'other', // 'youtube' | 'course' | 'paper' | 'blog' | 'other'
      notes: data.notes ? data.notes.trim() : '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      is_visited: !!data.is_visited,
      is_favorite: !!data.is_favorite,
      created_at: data.created_at || timestamp,
      updated_at: timestamp,
    };
    if (!MemoryDb.visit_later) {
      MemoryDb.visit_later = [];
    }
    MemoryDb.visit_later.unshift(item);
    MemoryDb.sync('visit_later', 'insert', item);
    return item;
  },

  getByUser(userId) {
    return (MemoryDb.visit_later || [])
      .filter((item) => item.user_id === userId)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  },

  update(id, fields) {
    if (!MemoryDb.visit_later) return;
    const item = MemoryDb.visit_later.find((n) => n.id === id);
    if (!item) return;
    const allowed = ['url', 'title', 'category', 'notes', 'tags', 'is_visited', 'is_favorite'];
    const updatedFields = {};
    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key)) {
        item[key] = value;
        updatedFields[key] = value;
      }
    }
    item.updated_at = now();
    updatedFields.updated_at = item.updated_at;
    MemoryDb.sync('visit_later', 'update', { id, ...updatedFields });
    return item;
  },

  delete(id) {
    if (!MemoryDb.visit_later) return;
    const index = MemoryDb.visit_later.findIndex((n) => n.id === id);
    if (index !== -1) {
      MemoryDb.visit_later.splice(index, 1);
      MemoryDb.sync('visit_later', 'delete', { id });
    }
  },
};
