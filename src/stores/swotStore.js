import { create } from 'zustand';
import { Session } from '../services/session';
import { useTaskStore } from './taskStore';

function getStorageKey(userId) {
  const effectiveUserId = userId || Session.getCurrentUserId() || 'guest';
  return `taskflow_swot_data_${effectiveUserId}`;
}

function createDefaultUserBoard(userId) {
  return {
    id: `board-${Date.now()}`,
    userId: userId || 'guest',
    name: 'Default Board',
    description: 'Personal strategic SWOT matrix',
    createdAt: new Date().toISOString(),
    items: [],
    towsStrategies: [],
  };
}

function loadUserSWOTData(userId) {
  const effectiveUserId = userId || Session.getCurrentUserId() || 'guest';
  const key = getStorageKey(effectiveUserId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.boards) && parsed.boards.length > 0) {
        return {
          userId: effectiveUserId,
          boards: parsed.boards,
          activeBoardId: parsed.activeBoardId || parsed.boards[0].id,
        };
      }
    }
  } catch (err) {
    console.error('[SWOTStore] Failed to load SWOT data for user:', effectiveUserId, err);
  }

  const defaultBoard = createDefaultUserBoard(effectiveUserId);
  return {
    userId: effectiveUserId,
    boards: [defaultBoard],
    activeBoardId: defaultBoard.id,
  };
}

export const useSWOTStore = create((set, get) => ({
  ...loadUserSWOTData(),

  initUser: (userId) => {
    const data = loadUserSWOTData(userId);
    set(data);
  },

  saveState: () => {
    try {
      const { userId, boards, activeBoardId } = get();
      const key = getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify({ boards, activeBoardId }));
    } catch (e) {
      console.error('[SWOTStore] Failed to persist user SWOT data', e);
    }
  },

  setActiveBoard: (boardId) => {
    set({ activeBoardId: boardId });
    get().saveState();
  },

  createBoard: ({ name, description }) => {
    const { userId } = get();
    const newBoard = {
      id: `board-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: userId || 'guest',
      name: name || 'Untitled Board',
      description: description || '',
      createdAt: new Date().toISOString(),
      items: [],
      towsStrategies: [],
    };
    set((state) => ({
      boards: [...state.boards, newBoard],
      activeBoardId: newBoard.id,
    }));
    get().saveState();
    return newBoard;
  },

  deleteBoard: (boardId) => {
    const { userId } = get();
    set((state) => {
      const remaining = state.boards.filter((b) => b.id !== boardId);
      if (remaining.length === 0) {
        const fallback = createDefaultUserBoard(userId);
        return { boards: [fallback], activeBoardId: fallback.id };
      }
      return {
        boards: remaining,
        activeBoardId: state.activeBoardId === boardId ? remaining[0].id : state.activeBoardId,
      };
    });
    get().saveState();
  },

  updateBoard: (boardId, updates) => {
    set((state) => ({
      boards: state.boards.map((b) => (b.id === boardId ? { ...b, ...updates } : b)),
    }));
    get().saveState();
  },

  getActiveBoard: () => {
    const { boards, activeBoardId } = get();
    if (!boards || boards.length === 0) return null;
    return boards.find((b) => b.id === activeBoardId) || boards[0];
  },

  // Item CRUD
  addItem: ({ quadrant, title, description, impact = 'medium', category = 'General' }) => {
    const activeBoard = get().getActiveBoard();
    if (!activeBoard) return null;

    const newItem = {
      id: `swot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      quadrant, // 'strengths' | 'weaknesses' | 'opportunities' | 'threats'
      title: title.trim(),
      description: description ? description.trim() : '',
      impact, // 'high' | 'medium' | 'low'
      category: category || 'General',
      status: 'identified', // 'identified' | 'in_action' | 'leveraged' | 'mitigated'
      linkedTaskId: null,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === activeBoard.id
          ? { ...b, items: [newItem, ...b.items] }
          : b
      ),
    }));
    get().saveState();
    return newItem;
  },

  updateItem: (itemId, updates) => {
    const activeBoard = get().getActiveBoard();
    if (!activeBoard) return;

    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === activeBoard.id
          ? {
              ...b,
              items: b.items.map((it) => (it.id === itemId ? { ...it, ...updates } : it)),
            }
          : b
      ),
    }));
    get().saveState();
  },

  deleteItem: (itemId) => {
    const activeBoard = get().getActiveBoard();
    if (!activeBoard) return;

    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === activeBoard.id
          ? {
              ...b,
              items: b.items.filter((it) => it.id !== itemId),
            }
          : b
      ),
    }));
    get().saveState();
  },

  moveItem: (itemId, targetQuadrant) => {
    get().updateItem(itemId, { quadrant: targetQuadrant });
  },

  // Convert SWOT item directly into a task in TaskFlow
  convertItemToTask: (itemId) => {
    const activeBoard = get().getActiveBoard();
    if (!activeBoard) return null;
    const item = activeBoard.items.find((it) => it.id === itemId);
    if (!item) return null;

    let priority = 'medium';
    if (item.impact === 'high') priority = 'high';
    if (item.impact === 'low') priority = 'low';

    const prefixMap = {
      strengths: '[Strength Leverage]',
      weaknesses: '[Weakness Fix]',
      opportunities: '[Opportunity Action]',
      threats: '[Threat Mitigation]',
    };

    const taskTitle = `${prefixMap[item.quadrant] || '[SWOT]'} ${item.title}`;
    const taskDescription = `${item.description ? `${item.description}\n\n` : ''}From SWOT Matrix: ${activeBoard.name} (${item.quadrant.toUpperCase()})\nCategory: ${item.category}`;

    try {
      const createdTask = useTaskStore.getState().createOneTimeTask({
        title: taskTitle,
        description: taskDescription,
        priority: priority,
        due_date: null,
      });

      if (createdTask) {
        get().updateItem(itemId, {
          linkedTaskId: createdTask.id,
          status: 'in_action',
        });
      }
      return createdTask;
    } catch (e) {
      console.error('[SWOTStore] Error creating task from SWOT item:', e);
      return null;
    }
  },

  // TOWS Strategy Initiatives CRUD
  addTOWSStrategy: ({ type, title, description }) => {
    const activeBoard = get().getActiveBoard();
    if (!activeBoard) return null;

    const newStrat = {
      id: `tows-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type, // 'SO' | 'WO' | 'ST' | 'WT'
      title: title.trim(),
      description: description ? description.trim() : '',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === activeBoard.id
          ? { ...b, towsStrategies: [...(b.towsStrategies || []), newStrat] }
          : b
      ),
    }));
    get().saveState();
    return newStrat;
  },

  updateTOWSStrategy: (strategyId, updates) => {
    const activeBoard = get().getActiveBoard();
    if (!activeBoard) return;

    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === activeBoard.id
          ? {
              ...b,
              towsStrategies: (b.towsStrategies || []).map((s) =>
                s.id === strategyId ? { ...s, ...updates } : s
              ),
            }
          : b
      ),
    }));
    get().saveState();
  },

  deleteTOWSStrategy: (strategyId) => {
    const activeBoard = get().getActiveBoard();
    if (!activeBoard) return;

    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === activeBoard.id
          ? {
              ...b,
              towsStrategies: (b.towsStrategies || []).filter((s) => s.id !== strategyId),
            }
          : b
      ),
    }));
    get().saveState();
  },
}));
