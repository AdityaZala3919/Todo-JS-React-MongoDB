import { create } from 'zustand';
import { Session } from '../services/session';
import { MemoryDb } from '../services/memory-db';
import { NoteRepository } from '../repositories/note-repository';
import { now } from '../utils/date';

function getStorageKey(userId) {
  const effectiveUserId = userId || Session.getCurrentUserId() || 'guest';
  return `taskflow_notes_data_${effectiveUserId}`;
}

function loadLocalNotes(userId) {
  const effectiveUserId = userId || Session.getCurrentUserId() || 'guest';
  const key = getStorageKey(effectiveUserId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.notes)) {
        return parsed.notes;
      }
    }
  } catch (err) {
    console.error('[NotesStore] Failed to load local notes:', err);
  }
  return [];
}

export const useNotesStore = create((set, get) => ({
  userId: Session.getCurrentUserId() || 'guest',
  notes: [],

  initUser: (userId) => {
    const effectiveUserId = userId || Session.getCurrentUserId() || 'guest';
    const memoryNotes = (MemoryDb.notes || []).filter((n) => n.user_id === effectiveUserId || !n.user_id);
    const localNotes = loadLocalNotes(effectiveUserId);

    // If MemoryDb has notes synced from MongoDB, use them; otherwise use local notes
    let notes = memoryNotes.length > 0 ? memoryNotes : localNotes;

    // Normalize timestamps (created_at & updated_at)
    notes = notes.map((n) => ({
      ...n,
      user_id: n.user_id || effectiveUserId,
      created_at: n.created_at || n.createdAt || now(),
      updated_at: n.updated_at || n.updatedAt || now(),
    }));

    // If memory notes was empty but local notes existed, sync local notes to MemoryDb / MongoDB
    if (memoryNotes.length === 0 && localNotes.length > 0 && effectiveUserId !== 'guest') {
      localNotes.forEach((ln) => {
        if (!MemoryDb.notes.some((m) => m.id === ln.id)) {
          NoteRepository.create({ ...ln, user_id: effectiveUserId });
        }
      });
    }

    set({ userId: effectiveUserId, notes });
    get().saveState();
  },

  saveState: () => {
    try {
      const { userId, notes } = get();
      const key = getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify({ notes }));
    } catch (e) {
      console.error('[NotesStore] Failed to persist notes locally', e);
    }
  },

  createNote: () => {
    const { userId } = get();
    const effectiveUserId = userId || Session.getCurrentUserId() || 'guest';
    const newNote = NoteRepository.create({
      user_id: effectiveUserId,
      title: '',
      content: '',
      color: '#1e1e2e',
      pinned: false,
    });

    set((state) => ({
      notes: [newNote, ...state.notes.filter((n) => n.id !== newNote.id)],
    }));
    get().saveState();
    return newNote;
  },

  updateNote: (id, updates) => {
    NoteRepository.update(id, updates);
    const timestamp = now();
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, ...updates, updated_at: timestamp } : n
      ),
    }));
    get().saveState();
  },

  deleteNote: (id) => {
    NoteRepository.delete(id);
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
    get().saveState();
  },

  togglePin: (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    get().updateNote(id, { pinned: !note.pinned });
  },
}));
