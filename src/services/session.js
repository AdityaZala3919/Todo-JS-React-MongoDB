/**
 * Session — Local session management using sessionStorage
 */
const SESSION_KEY = 'taskflow_session';

class SessionManagerClass {
  getCurrentUserId() {
    return sessionStorage.getItem(SESSION_KEY);
  }
  setCurrentUser(userId) {
    sessionStorage.setItem(SESSION_KEY, userId);
  }
  clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }
  isLoggedIn() {
    return this.getCurrentUserId() !== null;
  }
}

export const Session = new SessionManagerClass();
