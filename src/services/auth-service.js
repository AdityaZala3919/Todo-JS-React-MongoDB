import { UserRepository } from '../repositories/user-repository.js';
import { Session } from './session.js';
import { EventBus, Events } from './events.js';
import { validateEmail, validatePassword } from '../utils/validation.js';
import { MemoryDb } from './memory-db.js';
import { generateId } from '../utils/uuid.js';

export const AuthService = {
  async register(email, password, displayName) {
    const emailResult = validateEmail(email);
    if (!emailResult.valid) throw new Error(emailResult.error);
    const passResult = validatePassword(password);
    if (!passResult.valid) throw new Error(passResult.error);
    const id = generateId();
    const response = await fetch('/api/auth?action=register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, email, password, display_name: displayName }),
    });
    if (!response.ok) { const errData = await response.json().catch(() => ({})); throw new Error(errData.error || 'Registration failed'); }
    const user = await response.json();
    if (user._id && !user.id) user.id = user._id;
    await MemoryDb.loadUserData(user.id);
    MemoryDb.users.push(user);
    Session.setCurrentUser(user.id);
    EventBus.emit(Events.AUTH_REGISTER, user);
    EventBus.emit(Events.AUTH_LOGIN, user);
    return user;
  },
  async login(email, password) {
    const emailResult = validateEmail(email);
    if (!emailResult.valid) throw new Error(emailResult.error);
    if (!password) throw new Error('Password is required');
    const response = await fetch('/api/auth?action=login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) { const errData = await response.json().catch(() => ({})); throw new Error(errData.error || 'Invalid email or password'); }
    const safeUser = await response.json();
    if (safeUser._id && !safeUser.id) safeUser.id = safeUser._id;
    await MemoryDb.loadUserData(safeUser.id);
    if (!MemoryDb.users.some((u) => u.id === safeUser.id)) MemoryDb.users.push(safeUser);
    Session.setCurrentUser(safeUser.id);
    EventBus.emit(Events.AUTH_LOGIN, safeUser);
    return safeUser;
  },
  logout() { Session.clearSession(); MemoryDb.clear(); EventBus.emit(Events.AUTH_LOGOUT); },
  getCurrentUser() {
    const userId = Session.getCurrentUserId();
    if (!userId || userId === 'undefined' || userId === 'null') { if (userId) { Session.clearSession(); MemoryDb.clear(); } return null; }
    const user = UserRepository.findById(userId);
    if (!user) { Session.clearSession(); MemoryDb.clear(); return null; }
    return user;
  },
  isLoggedIn() { return this.getCurrentUser() !== null; },
  async changePassword(oldPassword, newPassword) {
    const userId = Session.getCurrentUserId(); if (!userId) throw new Error('Not logged in');
    const passResult = validatePassword(newPassword); if (!passResult.valid) throw new Error(passResult.error);
    const response = await fetch('/api/auth?action=change-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, old_password: oldPassword, new_password: newPassword }),
    });
    if (!response.ok) { const errData = await response.json().catch(() => ({})); throw new Error(errData.error || 'Password update failed'); }
  },
  async updateProfile(displayName) {
    const userId = Session.getCurrentUserId(); if (!userId) throw new Error('Not logged in');
    if (!displayName || !displayName.trim()) throw new Error('Display name is required');
    const response = await fetch('/api/auth?action=update-profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, display_name: displayName.trim() }),
    });
    if (!response.ok) { const errData = await response.json().catch(() => ({})); throw new Error(errData.error || 'Profile update failed'); }
    const user = MemoryDb.users.find((u) => u.id === userId);
    if (user) user.display_name = displayName.trim();
  },
};
