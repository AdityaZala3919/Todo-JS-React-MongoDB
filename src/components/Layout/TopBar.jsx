import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ListPlus, Layers } from 'lucide-react';
import styles from './TopBar.module.css';

export default function TopBar({ onNewTask, onBulkAdd, onBatchAdd }) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/tasks?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className={styles.topBar}>
      <div className={styles.searchBox}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search tasks, projects..."
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
        <kbd className={styles.kbd}>/</kbd>
      </div>
      <div className={styles.actions}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onBulkAdd}
          title="Quick Paste multiple tasks"
        >
          <ListPlus size={15} />
          <span className={styles.btnText}>Bulk Add</span>
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onBatchAdd}
          title="Add multiple structured tasks"
        >
          <Layers size={15} />
          <span className={styles.btnText}>Batch Form</span>
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={onNewTask}
          title="Create a new task"
        >
          <Plus size={16} />
          <span className={styles.btnText}>New Task</span>
        </button>
      </div>
    </header>
  );
}
