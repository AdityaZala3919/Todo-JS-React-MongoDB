import { create } from 'zustand';
import { AuthService } from '../services/auth-service.js';
import { MemoryDb } from '../services/memory-db.js';

export const useAuthStore = create((set) => ({
  user: null,
  isLoggedIn: false,
  loading: true,
  error: null,

  init: async () => {
    try {
      await MemoryDb.init();
      const user = AuthService.getCurrentUser();
      set({ user, isLoggedIn: !!user, loading: false });
    } catch {
      set({ user: null, isLoggedIn: false, loading: false });
    }
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      const user = await AuthService.login(email, password);
      set({ user, isLoggedIn: true, error: null });
      return user;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  register: async (email, password, displayName) => {
    set({ error: null });
    try {
      const user = await AuthService.register(email, password, displayName);
      set({ user, isLoggedIn: true, error: null });
      return user;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  logout: () => {
    AuthService.logout();
    set({ user: null, isLoggedIn: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
