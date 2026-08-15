import { MemoryDb } from '../services/memory-db.js';

export const UserRepository = {
  create(data) {
    const timestamp = new Date().toISOString();
    const user = {
      id: data.id,
      email: data.email.toLowerCase().trim(),
      display_name: data.display_name || data.email.split('@')[0],
      created_at: timestamp,
      updated_at: timestamp,
    };
    MemoryDb.users.push(user);
    MemoryDb.sync('users', 'insert', user);
    return user;
  },
  findByEmail(email) {
    return MemoryDb.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  },
  findById(id) {
    const user = MemoryDb.users.find((u) => u.id === id);
    if (!user) return null;
    const { password_hash, salt, ...safeUser } = user;
    return safeUser;
  },
  findByIdFull(id) {
    return MemoryDb.users.find((u) => u.id === id) || null;
  },
  update(id, fields) {
    const user = MemoryDb.users.find((u) => u.id === id);
    if (!user) return;
    const allowed = ['display_name', 'email'];
    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key)) user[key] = value;
    }
    user.updated_at = new Date().toISOString();
    MemoryDb.sync('users', 'update', { id, ...fields });
  },
  delete(id) {
    const index = MemoryDb.users.findIndex((u) => u.id === id);
    if (index !== -1) {
      MemoryDb.users.splice(index, 1);
      MemoryDb.sync('users', 'delete', { id });
    }
  },
};
