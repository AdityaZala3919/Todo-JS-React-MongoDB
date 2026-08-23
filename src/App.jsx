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
import Settings from './pages/Settings';
import Auth from './pages/Auth';

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
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <Sidebar />
      <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar
          onNewTask={() => setShowTaskForm(true)}
          onBulkAdd={() => setShowBulkAdd(true)}
          onBatchAdd={() => setShowBatchAdd(true)}
        />
        <main style={{ flex: 1, overflowY: 'auto' }}>
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

      <style>{`
        @media (max-width: 768px) {
          div { margin-left: 0 !important; }
          main { padding-bottom: calc(var(--bottom-nav-height) + 16px); }
        }
      `}</style>
    </div>
  );
}
