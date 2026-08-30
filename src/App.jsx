import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import MobileNav from './components/Layout/MobileNav';
import TaskForm from './components/Tasks/TaskForm';
import BulkAddModal from './components/Tasks/BulkAddModal';
import BatchFormModal from './components/Tasks/BatchFormModal';
import ToastContainer from './components/UI/Toast';

// Pages
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Timer from './pages/Timer';
import Calendar from './pages/Calendar';
import Statistics from './pages/Statistics';
import SWOT from './pages/SWOT';
import Settings from './pages/Settings';
import Notes from './pages/Notes';
import Auth from './pages/Auth';
import styles from './App.module.css';

export default function App() {
  const { init, isLoggedIn, loading } = useAuthStore();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [showBatchAdd, setShowBatchAdd] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-main)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--surface-3)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Loading TaskFlow...</p>
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
        <ToastContainer />
      </>
    );
  }

  return (
    <div className={styles.appLayout}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <TopBar
          onNewTask={() => setShowTaskForm(true)}
          onBulkAdd={() => setShowBulkAdd(true)}
          onBatchAdd={() => setShowBatchAdd(true)}
        />
        <main className={styles.mainContent}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  onNewTask={() => setShowTaskForm(true)}
                  onBulkAdd={() => setShowBulkAdd(true)}
                  onBatchAdd={() => setShowBatchAdd(true)}
                />
              }
            />
            <Route path="/tasks" element={<Tasks onNewTask={() => setShowTaskForm(true)} />} />
            <Route path="/timer" element={<Timer />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/swot" element={<SWOT />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      <MobileNav />
      {showTaskForm && <TaskForm onClose={() => setShowTaskForm(false)} />}
      {showBulkAdd && <BulkAddModal onClose={() => setShowBulkAdd(false)} />}
      {showBatchAdd && <BatchFormModal onClose={() => setShowBatchAdd(false)} />}
      <ToastContainer />
    </div>
  );
}
