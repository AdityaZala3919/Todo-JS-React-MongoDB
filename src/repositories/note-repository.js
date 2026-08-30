import { MemoryDb } from '../services/memory-db.js';
import { generateId } from '../utils/uuid.js';
import { now } from '../utils/date.js';

export const NoteRepository = {
  create(data) {
    const id = data.id || generateId();
    const timestamp = now();
    const note = {
      id,
      user_id: data.user_id,
      title: data.title ? data.title.trim() : '',
      content: data.content ? data.content.trim() : '',
      color: data.color || '#1e1e2e',
      pinned: !!data.pinned,
      created_at: data.created_at || timestamp,
      updated_at: timestamp,
    };
    MemoryDb.notes.unshift(note);
    MemoryDb.sync('notes', 'insert', note);
    return note;
  },

  getByUser(userId) {
    return (MemoryDb.notes || [])
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  },

  update(id, fields) {
    const note = MemoryDb.notes.find((n) => n.id === id);
    if (!note) return;
    const allowed = ['title', 'content', 'color', 'pinned'];
    const updatedFields = {};
    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key)) {
        note[key] = value;
        updatedFields[key] = value;
      }
    }
    note.updated_at = now();
    updatedFields.updated_at = note.updated_at;
    MemoryDb.sync('notes', 'update', { id, ...updatedFields });
    return note;
  },

  delete(id) {
    const index = MemoryDb.notes.findIndex((n) => n.id === id);
    if (index !== -1) {
      MemoryDb.notes.splice(index, 1);
      MemoryDb.sync('notes', 'delete', { id });
    }
  },
};
