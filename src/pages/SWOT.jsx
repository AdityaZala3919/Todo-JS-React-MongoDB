import { useState, useMemo, useEffect } from 'react';
import { 
  Target, Plus, LayoutGrid, Compass, List, 
  Search, ChevronDown, Trash2, Layers 
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useSWOTStore } from '../stores/swotStore';
import QuadrantCard from '../components/SWOT/QuadrantCard';
import SWOTItemModal from '../components/SWOT/SWOTItemModal';
import TOWSMatrix from '../components/SWOT/TOWSMatrix';
import NewBoardModal from '../components/SWOT/NewBoardModal';
import { toast } from '../components/UI/Toast';
import styles from './SWOT.module.css';

export default function SWOT() {
  const { user } = useAuthStore();
  const { 
    boards, 
    activeBoardId, 
    setActiveBoard,
    getActiveBoard, 
    deleteBoard,
    addItem,
    initUser
  } = useSWOTStore();

  useEffect(() => {
    if (user?.id) {
      initUser(user.id);
    }
  }, [user?.id, initUser]);

  const activeBoard = getActiveBoard();

  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' | 'tows' | 'list'
  const [activeListQuadrant, setActiveListQuadrant] = useState('strengths');
  const [searchQuery, setSearchQuery] = useState('');
  const [impactFilter, setImpactFilter] = useState('all');

  // Modals & Panels
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalInitialQuadrant, setModalInitialQuadrant] = useState('strengths');
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!activeBoard?.items) return [];
    return activeBoard.items.filter((item) => {
      if (impactFilter !== 'all' && item.impact !== impactFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const matchesCat = item.category?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [activeBoard, impactFilter, searchQuery]);

  const strengths = filteredItems.filter((it) => it.quadrant === 'strengths');
  const weaknesses = filteredItems.filter((it) => it.quadrant === 'weaknesses');
  const opportunities = filteredItems.filter((it) => it.quadrant === 'opportunities');
  const threats = filteredItems.filter((it) => it.quadrant === 'threats');
  const actionItemsCount = activeBoard?.items?.filter((it) => it.linkedTaskId || it.status === 'in_action')?.length || 0;

  const handleEditItem = (item) => {
    setEditingItem(item);
    setModalInitialQuadrant(item.quadrant);
    setShowItemModal(true);
  };

  const handleOpenAddModal = (quadrant = 'strengths') => {
    setEditingItem(null);
    setModalInitialQuadrant(quadrant);
    setShowItemModal(true);
  };

  const handleDeleteCurrentBoard = () => {
    if (boards.length <= 1) {
      toast.error('You must have at least one board');
      return;
    }
    if (window.confirm(`Are you sure you want to delete board "${activeBoard?.name}"?`)) {
      deleteBoard(activeBoard.id);
      toast.success('Board deleted');
    }
  };

  return (
    <div className={styles.page || 'swot-page'} style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', scrollBehavior: 'smooth', transform: 'translateZ(0)' }}>
      {/* Top Header */}
      <div className={styles.topHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div className={styles.titleArea} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className={styles.iconWrap} style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-lg)', background: 'var(--accent-subtle)', border: '1px solid rgba(129, 140, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-bright)' }}>
            <Target size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className={styles.title} style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>SWOT Analysis</h1>
            <p className={styles.subtitle} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>Strategic Personal & Project Reflection Matrix</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Custom Sleek Board Selector Dropdown */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <select
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                padding: '7px 32px 7px 14px',
                borderRadius: 'var(--radius-full)',
                background: '#12131c',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                minWidth: '160px',
              }}
              value={activeBoardId}
              onChange={(e) => setActiveBoard(e.target.value)}
            >
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: '12px', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowNewBoardModal(true)}
            title="Create a new board"
          >
            <Plus size={14} />
            <span>New Board</span>
          </button>

          {boards.length > 1 && (
            <button
              className="btn-ghost btn-sm"
              onClick={handleDeleteCurrentBoard}
              title="Delete current board"
              style={{ color: 'var(--status-error)' }}
            >
              <Trash2 size={15} />
            </button>
          )}

          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleOpenAddModal('strengths')}
          >
            <Plus size={14} />
            <span>Add Insight</span>
          </button>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className={styles.statsRibbon} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div className={styles.statCard} style={{ background: '#11131c', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span className={styles.statLabel} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Strengths</span>
            <div className={styles.statValue} style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: '#10b981' }}>
              {strengths.length}
            </div>
          </div>
        </div>
        <div className={styles.statCard} style={{ background: '#11131c', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span className={styles.statLabel} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Weaknesses</span>
            <div className={styles.statValue} style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: '#f59e0b' }}>
              {weaknesses.length}
            </div>
          </div>
        </div>
        <div className={styles.statCard} style={{ background: '#11131c', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span className={styles.statLabel} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Opportunities</span>
            <div className={styles.statValue} style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: '#38bdf8' }}>
              {opportunities.length}
            </div>
          </div>
        </div>
        <div className={styles.statCard} style={{ background: '#11131c', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span className={styles.statLabel} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Threats</span>
            <div className={styles.statValue} style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: '#f43f5e' }}>
              {threats.length}
            </div>
          </div>
        </div>
        <div className={styles.statCard} style={{ background: '#11131c', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span className={styles.statLabel} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Action Items</span>
            <div className={styles.statValue} style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--accent-bright)' }}>
              {actionItemsCount}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: 'var(--surface-1)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '10px 16px' }}>
        <div className={styles.toolbarLeft} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className={styles.viewTabs} style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 'var(--radius-full)', padding: '3px', gap: '2px' }}>
            <button
              className={`${styles.viewTab} ${viewMode === 'matrix' ? styles.active : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer', border: 'none', background: viewMode === 'matrix' ? 'var(--accent-dim)' : 'transparent', color: viewMode === 'matrix' ? '#fff' : 'var(--text-muted)' }}
              onClick={() => setViewMode('matrix')}
            >
              <LayoutGrid size={14} />
              <span>2×2 Matrix</span>
            </button>
            <button
              className={`${styles.viewTab} ${viewMode === 'tows' ? styles.active : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer', border: 'none', background: viewMode === 'tows' ? 'var(--accent-dim)' : 'transparent', color: viewMode === 'tows' ? '#fff' : 'var(--text-muted)' }}
              onClick={() => setViewMode('tows')}
            >
              <Compass size={14} />
              <span>TOWS Strategy</span>
            </button>
            <button
              className={`${styles.viewTab} ${viewMode === 'list' ? styles.active : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer', border: 'none', background: viewMode === 'list' ? 'var(--accent-dim)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--text-muted)' }}
              onClick={() => setViewMode('list')}
            >
              <List size={14} />
              <span>Focus Tab</span>
            </button>
          </div>

          <div className={styles.searchBox} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-full)', padding: '6px 14px' }}>
            <Search size={13} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Filter insights..."
              style={{ border: 'none', fontSize: 'var(--text-xs)', color: 'var(--text-primary)', width: '130px', outline: 'none', background: 'transparent' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <select
              className={styles.filterSelect}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                padding: '6px 28px 6px 12px',
                fontSize: 'var(--text-xs)',
                borderRadius: 'var(--radius-full)',
                background: '#12131c',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                outline: 'none',
              }}
              value={impactFilter}
              onChange={(e) => setImpactFilter(e.target.value)}
            >
              <option value="all">All Impacts</option>
              <option value="high">High Impact</option>
              <option value="medium">Medium Impact</option>
              <option value="low">Low Impact</option>
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: '10px', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'matrix' && (
        <div className={styles.matrixGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '20px' }}>
          <QuadrantCard
            quadrant="strengths"
            items={strengths}
            onEditItem={handleEditItem}
          />
          <QuadrantCard
            quadrant="weaknesses"
            items={weaknesses}
            onEditItem={handleEditItem}
          />
          <QuadrantCard
            quadrant="opportunities"
            items={opportunities}
            onEditItem={handleEditItem}
          />
          <QuadrantCard
            quadrant="threats"
            items={threats}
            onEditItem={handleEditItem}
          />
        </div>
      )}

      {viewMode === 'tows' && <TOWSMatrix />}

      {viewMode === 'list' && (
        <div className={styles.listView}>
          <div className={styles.listTabs}>
            {[
              { key: 'strengths', label: `Strengths (${strengths.length})` },
              { key: 'weaknesses', label: `Weaknesses (${weaknesses.length})` },
              { key: 'opportunities', label: `Opportunities (${opportunities.length})` },
              { key: 'threats', label: `Threats (${threats.length})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`${styles.listTabBtn} ${activeListQuadrant === key ? styles.activeListTab : ''}`}
                onClick={() => setActiveListQuadrant(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <QuadrantCard
            quadrant={activeListQuadrant}
            items={
              activeListQuadrant === 'strengths'
                ? strengths
                : activeListQuadrant === 'weaknesses'
                ? weaknesses
                : activeListQuadrant === 'opportunities'
                ? opportunities
                : threats
            }
            onEditItem={handleEditItem}
          />
        </div>
      )}

      {/* Modals */}
      {showItemModal && (
        <SWOTItemModal
          item={editingItem}
          initialQuadrant={modalInitialQuadrant}
          onClose={() => {
            setShowItemModal(false);
            setEditingItem(null);
          }}
        />
      )}

      {showNewBoardModal && (
        <NewBoardModal onClose={() => setShowNewBoardModal(false)} />
      )}
    </div>
  );
}
