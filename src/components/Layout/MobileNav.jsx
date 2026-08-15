import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListTodo, Timer, CalendarDays, BarChart3 } from 'lucide-react';
import styles from './MobileNav.module.css';

const items = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/timer', icon: Timer, label: 'Timer' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/statistics', icon: BarChart3, label: 'Stats' },
];

export default function MobileNav() {
  return (
    <nav className={styles.mobileNav}>
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}>
          <Icon size={20} strokeWidth={1.8} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
