import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListTodo, Timer, CalendarDays, BarChart3, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import styles from './Sidebar.module.css';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/timer', icon: Timer, label: 'Timer' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/statistics', icon: BarChart3, label: 'Statistics' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>T</div>
        <span className={styles.logoText}>TaskFlow</span>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navLabel}>Menu</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.bottom}>
        <NavLink to="/settings" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <Settings size={18} strokeWidth={1.8} />
          <span>Settings</span>
        </NavLink>
        <div className={styles.userSection}>
          <div className={styles.avatar}>{(user?.display_name || user?.email || 'U').slice(0, 2).toUpperCase()}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.display_name || user?.email?.split('@')[0] || 'User'}</span>
          </div>
          <button onClick={logout} className={styles.logoutBtn} title="Logout"><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  );
}
