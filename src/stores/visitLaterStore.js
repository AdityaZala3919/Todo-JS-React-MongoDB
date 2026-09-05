import { create } from 'zustand';
import { Session } from '../services/session';
import { MemoryDb } from '../services/memory-db';
import { VisitLaterRepository } from '../repositories/visit-later-repository';
import { now } from '../utils/date';
import { normalizeUrl, detectCategory, generateSuggestedTitle } from '../utils/urlHelper';

function getStorageKey(userId) {
  const effectiveUserId = userId || Session.getCurrentUserId() || 'guest';
  return `taskflow_visit_later_data_${effectiveUserId}`;
}

function loadLocalVisitLater(userId) {
  const effectiveUserId = userId || Session.getCurrentUserId() || 'guest';
  const key = getStorageKey(effectiveUserId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.items)) {
        return parsed.items;
      }
    }
  } catch (err) {
    console.error('[VisitLaterStore] Failed to load local visit later items:', err);
  }
  return [];
}

export const useVisitLaterStore = create((set, get) => ({
  userId: Session.getCurrentUserId() || 'guest',
  items: [],

  initUser: (userId) => {
    const effectiveUserId = userId || Session.getCurrentUserId() || 'guest';
    const memoryItems = (MemoryDb.visit_later || []).filter(
      (item) => item.user_id === effectiveUserId || !item.user_id
    );
    const localItems = loadLocalVisitLater(effectiveUserId);

    let items = memoryItems.length > 0 ? memoryItems : localItems;

    items = items.map((item) => ({
      ...item,
      user_id: item.user_id || effectiveUserId,
      created_at: item.created_at || item.createdAt || now(),
      updated_at: item.updated_at || item.updatedAt || now(),
    }));

    if (memoryItems.length === 0 && localItems.length > 0 && effectiveUserId !== 'guest') {
      localItems.forEach((li) => {
        if (!MemoryDb.visit_later.some((m) => m.id === li.id)) {
          VisitLaterRepository.create({ ...li, user_id: effectiveUserId });
        }
      });
    }

    set({ userId: effectiveUserId, items });
    get().saveState();
  },

  saveState: () => {
    try {
      const { userId, items } = get();
      const key = getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify({ items }));
    } catch (e) {
      console.error('[VisitLaterStore] Failed to persist visit later data locally', e);
    }
  },

  addItem: ({ url, title, category, notes, tags }) => {
    const { userId } = get();
    const effectiveUserId = userId || Session.getCurrentUserId() || 'guest';
    const cleanUrl = normalizeUrl(url);
    const detected = detectCategory(cleanUrl);
    const itemCategory = category || detected;
    const finalTitle = title ? title.trim() : generateSuggestedTitle(cleanUrl, itemCategory);

    const newItem = VisitLaterRepository.create({
      user_id: effectiveUserId,
      url: cleanUrl,
      title: finalTitle,
      category: itemCategory,
      notes: notes || '',
      tags: Array.isArray(tags) ? tags : [],
      is_visited: false,
      is_favorite: false,
    });

    set((state) => ({
      items: [newItem, ...state.items.filter((item) => item.id !== newItem.id)],
    }));
    get().saveState();
    return newItem;
  },

  updateItem: (id, updates) => {
    VisitLaterRepository.update(id, updates);
    const timestamp = now();
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates, updated_at: timestamp } : item
      ),
    }));
    get().saveState();
  },

  deleteItem: (id) => {
    VisitLaterRepository.delete(id);
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
    get().saveState();
  },

  toggleVisited: (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    get().updateItem(id, { is_visited: !item.is_visited });
  },

  toggleFavorite: (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    get().updateItem(id, { is_favorite: !item.is_favorite });
  },
}));
