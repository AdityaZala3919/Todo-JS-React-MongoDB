import { useState, useEffect, useMemo } from 'react';
import {
  Bookmark,
  Youtube,
  GraduationCap,
  FileText,
  BookOpen,
  Globe,
  Plus,
  ExternalLink,
  Search,
  Trash2,
  Edit3,
  Star,
  Check,
  Copy,
  X,
  Sparkles,
  Play,
  CheckCircle2,
  Layers,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useVisitLaterStore } from '../stores/visitLaterStore';
import {
  detectCategory,
  extractDomain,
  getYouTubeThumbnail,
  generateSuggestedTitle,
  normalizeUrl,
} from '../utils/urlHelper';
import { formatDate } from '../utils/date';
import { toast } from '../components/UI/Toast';
import styles from './VisitLater.module.css';

export const CATEGORIES = [
  { id: 'all', label: 'All Links', icon: Layers, color: 'var(--accent)' },
  { id: 'youtube', label: 'YouTube Videos', icon: Youtube, color: '#f87171' },
  { id: 'course', label: 'Courses', icon: GraduationCap, color: '#34d399' },
  { id: 'paper', label: 'Research Papers', icon: FileText, color: '#60a5fa' },
  { id: 'blog', label: 'Blogs & Articles', icon: BookOpen, color: '#fbbf24' },
  { id: 'other', label: 'Other Links', icon: Globe, color: '#a78bfa' },
];

const CATEGORY_NAMES = {
  youtube: 'YouTube Video',
  course: 'Course',
  paper: 'Research Paper',
  blog: 'Blog & Article',
  other: 'Other',
};

const CATEGORY_ICONS = {
  youtube: Youtube,
  course: GraduationCap,
  paper: FileText,
  blog: BookOpen,
  other: Globe,
};

/* ══════════════════════════════════════════════
   Add / Edit Modal Component
══════════════════════════════════════════════ */
function LinkModal({ item, onClose, onSave }) {
  const isEditing = !!item?.id;
  const [url, setUrl] = useState(item?.url || '');
  const [title, setTitle] = useState(item?.title || '');
  const [category, setCategory] = useState(item?.category || 'youtube');
  const [notes, setNotes] = useState(item?.notes || '');
  const [isFavorite, setIsFavorite] = useState(!!item?.is_favorite);

  const handleUrlChange = (e) => {
    const val = e.target.value;
    setUrl(val);
    if (!isEditing && val) {
      const detected = detectCategory(val);
      setCategory(detected);
      if (!title) {
        setTitle(generateSuggestedTitle(val, detected));
      }
    }
  };

  const handleAutoSuggestTitle = () => {
    if (url) {
      setTitle(generateSuggestedTitle(url, category));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }
    const cleanUrl = normalizeUrl(url);
    const finalTitle = title.trim() || generateSuggestedTitle(cleanUrl, category);

    onSave({
      url: cleanUrl,
      title: finalTitle,
      category,
      notes: notes.trim(),
      is_favorite: isFavorite,
    });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isEditing ? 'Edit Link' : 'Add Link to Visit Later'}</h2>
          <button className="btn-ghost" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span>Resource URL</span>
            </label>
            <input
              type="text"
              className={styles.modalInput}
              placeholder="https://..."
              value={url}
              onChange={handleUrlChange}
              autoFocus
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span>Title / Heading</span>
              <span className={styles.autoFillBtn} onClick={handleAutoSuggestTitle}>
                Auto-suggest title
              </span>
            </label>
            <input
              type="text"
              className={styles.modalInput}
              placeholder="e.g. CS50 Full Course or Attention Is All You Need"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Category</label>
            <select
              className={styles.modalInput}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="youtube">YouTube Videos</option>
              <option value="course">Courses</option>
              <option value="paper">Research Papers</option>
              <option value="blog">Blogs & Articles</option>
              <option value="other">Other Links</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Notes / Takeaways (optional)</label>
            <textarea
              className={styles.modalTextarea}
              placeholder="Why are you saving this? Key topics to review..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              id="fav-check"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
            />
            <label htmlFor="fav-check" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Star this resource as high priority
            </label>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              {isEditing ? 'Save Changes' : 'Add to Visit Later'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Link Card Component
══════════════════════════════════════════════ */
function LinkCard({ item, onToggleVisited, onToggleFavorite, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);
  const domain = extractDomain(item.url);
  const isYouTube = item.category === 'youtube' || item.url.includes('youtube.com') || item.url.includes('youtu.be');
  const ytThumbnail = isYouTube ? getYouTubeThumbnail(item.url) : null;
  const CategoryIcon = CATEGORY_ICONS[item.category] || Globe;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.url);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`${styles.linkCard} ${!ytThumbnail ? `${styles.cardNoThumbnail} ${styles[`card_${item.category}`] || ''}` : ''} ${item.is_visited ? styles.cardVisited : ''}`}
    >
      {/* Optional YouTube Thumbnail with Play Button */}
      {ytThumbnail && (
        <div
          className={styles.thumbnailWrapper}
          onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
          title="Watch on YouTube (Opens in new tab)"
        >
          <img
            src={ytThumbnail}
            alt={item.title || 'YouTube thumbnail'}
            className={styles.thumbnailImg}
            loading="lazy"
            onError={(e) => {
              // Hide image container if YouTube doesn't serve thumbnail
              e.currentTarget.parentElement.style.display = 'none';
            }}
          />
          <div className={styles.playOverlay}>
            <div className={styles.playIconCircle}>
              <Play size={20} fill="#fff" style={{ marginLeft: '3px' }} />
            </div>
          </div>
        </div>
      )}

      {/* Meta Top: Category badge + Domain pill + Star */}
      <div className={styles.cardMeta}>
        <div className={styles.cardBadges}>
          <span className={`${styles.categoryBadge} ${styles[`badge_${item.category}`] || styles.badge_other}`}>
            <CategoryIcon size={12} />
            <span>{CATEGORY_NAMES[item.category] || 'Link'}</span>
          </span>
          <span className={styles.domainBadge}>
            <Globe size={11} />
            <span>{domain}</span>
          </span>
        </div>

        <button
          className={`${styles.pinBtn} ${item.is_favorite ? styles.pinBtnActive : ''}`}
          onClick={() => onToggleFavorite(item.id)}
          title={item.is_favorite ? 'Starred (High Priority)' : 'Star resource'}
        >
          <Star size={15} fill={item.is_favorite ? '#fbbf24' : 'transparent'} />
        </button>
      </div>

      {/* Main Content */}
      <div className={styles.cardMain}>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.cardTitleLink} ${item.is_visited ? styles.cardTitleVisited : ''}`}
          title={item.title || item.url}
        >
          {item.title || item.url}
        </a>

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.cardUrlLink}
          title={item.url}
        >
          <ExternalLink size={12} style={{ flexShrink: 0 }} />
          <span>{item.url}</span>
        </a>

        {item.notes && <p className={styles.cardNotes}>{item.notes}</p>}
      </div>

      {/* Footer / Actions */}
      <div className={styles.cardFooter}>
        <div className={styles.cardDate}>
          {formatDate(item.created_at || item.createdAt, { short: true }) || 'Recent'}
        </div>

        <div className={styles.cardActions}>
          <button
            className={`${styles.visitToggleBtn} ${item.is_visited ? styles.visitToggleBtnVisited : ''}`}
            onClick={() => onToggleVisited(item.id)}
            title={item.is_visited ? 'Mark as to visit' : 'Mark as visited'}
          >
            {item.is_visited ? <CheckCircle2 size={13} /> : <Check size={13} />}
            <span>{item.is_visited ? 'Visited' : 'Mark Visited'}</span>
          </button>

          <button
            className={styles.actionBtn}
            onClick={handleCopy}
            title={copied ? 'Copied' : 'Copy link'}
          >
            {copied ? <Check size={14} color="var(--status-success)" /> : <Copy size={14} />}
          </button>

          <button
            className={styles.actionBtn}
            onClick={() => onEdit(item)}
            title="Edit"
          >
            <Edit3 size={14} />
          </button>

          <button
            className={styles.actionBtn}
            onClick={() => onDelete(item.id)}
            title="Delete"
            style={{ color: 'var(--status-error)' }}
          >
            <Trash2 size={14} />
          </button>

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.openLinkBtn}
            title="Open in new tab"
          >
            <span>Open</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Link List Item Component (Compact List View)
══════════════════════════════════════════════ */
function LinkListItem({ item, onToggleVisited, onToggleFavorite, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);
  const domain = extractDomain(item.url);
  const isYouTube = item.category === 'youtube' || item.url.includes('youtube.com') || item.url.includes('youtu.be');
  const ytThumbnail = isYouTube ? getYouTubeThumbnail(item.url) : null;
  const CategoryIcon = CATEGORY_ICONS[item.category] || Globe;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.url);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`${styles.listItem} ${item.is_visited ? styles.listItemVisited : ''}`}>
      <div className={styles.listLeft}>
        {ytThumbnail ? (
          <div
            className={styles.listMedia}
            onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
            title="Watch on YouTube (Opens in new tab)"
          >
            <img src={ytThumbnail} alt={item.title || 'YouTube'} className={styles.listThumbnailImg} loading="lazy" />
            <div className={styles.playOverlay}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Play size={12} fill="#fff" style={{ marginLeft: '2px' }} />
              </div>
            </div>
          </div>
        ) : (
          <div className={`${styles.listIconBox} ${styles[`badge_${item.category}`] || styles.badge_other}`}>
            <CategoryIcon size={18} />
          </div>
        )}

        <div className={styles.listContent}>
          <div className={styles.listTitleRow}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.listTitleLink}
              title={item.title || item.url}
            >
              {item.title || item.url}
            </a>
            <span className={`${styles.categoryBadge} ${styles[`badge_${item.category}`] || styles.badge_other}`}>
              <CategoryIcon size={11} />
              <span>{CATEGORY_NAMES[item.category] || 'Link'}</span>
            </span>
            <span className={styles.domainBadge}>
              <Globe size={11} />
              <span>{domain}</span>
            </span>
          </div>

          <div className={styles.listMetaRow}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.cardUrlLink}
              title={item.url}
            >
              <ExternalLink size={11} />
              <span>{item.url}</span>
            </a>
            {item.notes && <span style={{ color: 'var(--text-secondary)' }}>• {item.notes}</span>}
            <span>• {formatDate(item.created_at || item.createdAt, { short: true }) || 'Recent'}</span>
          </div>
        </div>
      </div>

      <div className={styles.listActions}>
        <button
          className={`${styles.pinBtn} ${item.is_favorite ? styles.pinBtnActive : ''}`}
          onClick={() => onToggleFavorite(item.id)}
          title={item.is_favorite ? 'Starred (High Priority)' : 'Star resource'}
        >
          <Star size={15} fill={item.is_favorite ? '#fbbf24' : 'transparent'} />
        </button>

        <button
          className={`${styles.visitToggleBtn} ${item.is_visited ? styles.visitToggleBtnVisited : ''}`}
          onClick={() => onToggleVisited(item.id)}
          title={item.is_visited ? 'Mark as to visit' : 'Mark as visited'}
        >
          {item.is_visited ? <CheckCircle2 size={13} /> : <Check size={13} />}
          <span>{item.is_visited ? 'Visited' : 'Mark Visited'}</span>
        </button>

        <button
          className={styles.actionBtn}
          onClick={handleCopy}
          title={copied ? 'Copied' : 'Copy link'}
        >
          {copied ? <Check size={14} color="var(--status-success)" /> : <Copy size={14} />}
        </button>

        <button
          className={styles.actionBtn}
          onClick={() => onEdit(item)}
          title="Edit"
        >
          <Edit3 size={14} />
        </button>

        <button
          className={styles.actionBtn}
          onClick={() => onDelete(item.id)}
          title="Delete"
          style={{ color: 'var(--status-error)' }}
        >
          <Trash2 size={14} />
        </button>

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.openLinkBtn}
          title="Open in new tab"
        >
          <span>Open</span>
          <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Main Visit Later Page
══════════════════════════════════════════════ */
export default function VisitLater() {
  const { user } = useAuthStore();
  const {
    items,
    initUser,
    addItem,
    updateItem,
    deleteItem,
    toggleVisited,
    toggleFavorite,
  } = useVisitLaterStore();

  // Filters & State
  const [activeCategory, setActiveCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'to_visit' | 'visited' | 'favorites'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'title'
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('taskflow_visit_later_view') || 'grid';
    } catch {
      return 'grid';
    }
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('taskflow_visit_later_view', mode);
    } catch {}
  };

  // Quick Dump input state
  const [quickUrl, setQuickUrl] = useState('');
  const [quickCategory, setQuickCategory] = useState('youtube');
  const [detectedCategoryName, setDetectedCategoryName] = useState('');

  // Modal state
  const [modalItem, setModalItem] = useState(null); // null = closed, {} = new, item = editing
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      initUser(user.id);
    }
  }, [user?.id, initUser]);

  // Handle Quick URL typing/pasting
  const handleQuickUrlChange = (e) => {
    const val = e.target.value;
    setQuickUrl(val);
    if (val.trim()) {
      const detected = detectCategory(val);
      setQuickCategory(detected);
      setDetectedCategoryName(CATEGORY_NAMES[detected] || 'Other');
    } else {
      setDetectedCategoryName('');
    }
  };

  const handleQuickDump = (e) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;

    const cleanUrl = normalizeUrl(quickUrl);
    const category = quickCategory || detectCategory(cleanUrl);
    const suggestedTitle = generateSuggestedTitle(cleanUrl, category);

    addItem({
      url: cleanUrl,
      title: suggestedTitle,
      category,
      notes: '',
    });

    toast.success(`Saved to Visit Later (${CATEGORY_NAMES[category] || 'Link'})`);
    setQuickUrl('');
    setDetectedCategoryName('');
  };

  // Counts per category
  const counts = useMemo(() => {
    const res = { all: items.length, youtube: 0, course: 0, paper: 0, blog: 0, other: 0 };
    items.forEach((item) => {
      const cat = item.category || 'other';
      if (res[cat] !== undefined) res[cat] += 1;
      else res.other += 1;
    });
    return res;
  }, [items]);

  const unvisitedCount = useMemo(() => {
    return items.filter((i) => !i.is_visited).length;
  }, [items]);

  // Filtered and Sorted list
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter((i) => i.category === activeCategory);
    }

    // Status filter
    if (statusFilter === 'to_visit') {
      result = result.filter((i) => !i.is_visited);
    } else if (statusFilter === 'visited') {
      result = result.filter((i) => i.is_visited);
    } else if (statusFilter === 'favorites') {
      result = result.filter((i) => i.is_favorite);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          (i.title && i.title.toLowerCase().includes(q)) ||
          (i.url && i.url.toLowerCase().includes(q)) ||
          (i.notes && i.notes.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      // Always keep favorites near top if requested, or sort by criteria
      if (sortBy === 'newest') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

    return result;
  }, [items, activeCategory, statusFilter, searchQuery, sortBy]);

  const handleDelete = (id) => {
    const item = items.find((i) => i.id === id);
    deleteItem(id);
    toast.success('Removed link', {
      label: 'Undo',
      fn: () => {
        if (item) addItem(item);
      },
    });
  };

  return (
    <div className={styles.page}>
      {/* ── Page Header ── */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.iconWrap}>
            <Bookmark size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className={styles.title}>Visit Later</h1>
            <p className={styles.subtitle}>
              {items.length} resource{items.length !== 1 ? 's' : ''} saved • {unvisitedCount} to visit
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search saved links…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className={styles.clearBtn} onClick={() => setSearchQuery('')}>
                <X size={12} />
              </button>
            )}
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setModalItem({});
              setShowModal(true);
            }}
          >
            <Plus size={15} />
            <span>Add Link</span>
          </button>
        </div>
      </div>

      {/* ── Quick Dump Bar (Watch Later Dump) ── */}
      <div className={styles.quickDumpCard}>
        <form onSubmit={handleQuickDump} className={styles.quickDumpRow}>
          <div className={styles.quickInputWrapper}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              className={styles.quickInput}
              placeholder="Quick dump: Paste YouTube, course, research paper, or blog link and press Enter..."
              value={quickUrl}
              onChange={handleQuickUrlChange}
            />
          </div>

          <select
            className={styles.categorySelect}
            value={quickCategory}
            onChange={(e) => setQuickCategory(e.target.value)}
          >
            <option value="youtube">📺 YouTube</option>
            <option value="course">🎓 Course</option>
            <option value="paper">📄 Research Paper</option>
            <option value="blog">✍️ Blog</option>
            <option value="other">🌐 Other</option>
          </select>

          <div className={styles.quickDumpActions}>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={!quickUrl.trim()}
              style={{ opacity: quickUrl.trim() ? 1 : 0.6 }}
            >
              <Plus size={14} />
              <span>Dump Link</span>
            </button>
          </div>
        </form>

        {detectedCategoryName && (
          <div className={styles.autoDetectedHint}>
            <Sparkles size={12} />
            <span>Auto-detected: <strong>{detectedCategoryName}</strong></span>
          </div>
        )}
      </div>

      {/* ── Category Tabs ── */}
      <div className={styles.categoryNav}>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              className={`${styles.catTab} ${isActive ? styles.catTabActive : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <Icon size={14} />
              <span>{cat.label}</span>
              <span className={styles.catCount}>{counts[cat.id] ?? 0}</span>
            </button>
          );
        })}
      </div>

      {/* ── Secondary Controls: Status Filter & Sort ── */}
      <div className={styles.subControls}>
        <div className={styles.statusFilterGroup}>
          {[
            { id: 'all', label: 'All' },
            { id: 'to_visit', label: 'To Visit' },
            { id: 'visited', label: 'Visited' },
            { id: 'favorites', label: 'Starred' },
          ].map((status) => (
            <button
              key={status.id}
              className={`${styles.statusBtn} ${statusFilter === status.id ? styles.statusBtnActive : ''}`}
              onClick={() => setStatusFilter(status.id)}
            >
              {status.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Sort by:</span>
            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>

          <div className={styles.viewModeToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
              onClick={() => handleSetViewMode('grid')}
              title="Card view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
              onClick={() => handleSetViewMode('list')}
              title="List view"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Links Display (Grid or List) ── */}
      {filteredItems.length > 0 ? (
        viewMode === 'list' ? (
          <div className={styles.linksList}>
            {filteredItems.map((item) => (
              <LinkListItem
                key={item.id}
                item={item}
                onToggleVisited={toggleVisited}
                onToggleFavorite={toggleFavorite}
                onEdit={(editItem) => {
                  setModalItem(editItem);
                  setShowModal(true);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className={styles.linksGrid}>
            {filteredItems.map((item) => (
              <LinkCard
                key={item.id}
                item={item}
                onToggleVisited={toggleVisited}
                onToggleFavorite={toggleFavorite}
                onEdit={(editItem) => {
                  setModalItem(editItem);
                  setShowModal(true);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )
      ) : (
        <div className={styles.emptyState}>
          <Bookmark size={44} strokeWidth={1.2} />
          <p className={styles.emptyTitle}>
            {searchQuery
              ? 'No matching links found'
              : activeCategory !== 'all'
              ? `No ${CATEGORY_NAMES[activeCategory] || ''} links saved yet`
              : 'Your Visit Later list is empty'}
          </p>
          <p className={styles.emptyDesc}>
            {searchQuery
              ? `We couldn't find any saved links matching "${searchQuery}". Try a different keyword.`
              : 'Paste any YouTube video, online course, research paper, or blog article in the box above to queue it up!'}
          </p>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <LinkModal
          item={modalItem}
          onClose={() => {
            setShowModal(false);
            setModalItem(null);
          }}
          onSave={(data) => {
            if (modalItem?.id) {
              updateItem(modalItem.id, data);
              toast.success('Link updated');
            } else {
              addItem(data);
              toast.success('Added to Visit Later');
            }
          }}
        />
      )}
    </div>
  );
}
