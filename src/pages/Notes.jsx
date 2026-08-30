import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  StickyNote, Plus, Pin, PinOff, Trash2, Search, X, Palette,
  Bold, Italic, Underline, Strikethrough,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useNotesStore } from '../stores/notesStore';
import { formatDate } from '../utils/date';
import styles from './Notes.module.css';

/* ── color swatches ── */
const NOTE_COLORS = [
  { label: 'Default',  value: '#1e1e2e' },
  { label: 'Slate',    value: '#1a1f2e' },
  { label: 'Emerald',  value: '#0f2318' },
  { label: 'Amber',    value: '#221a08' },
  { label: 'Rose',     value: '#220e12' },
  { label: 'Violet',   value: '#180e24' },
  { label: 'Teal',     value: '#0b1e1d' },
  { label: 'Sky',      value: '#0b1624' },
  { label: 'Crimson',  value: '#1f0b0b' },
  { label: 'Olive',    value: '#181e0a' },
];

/* ── tiny helper: wrap textarea selection with a prefix/suffix ── */
function wrapSelection(textarea, before, after = before) {
  const start = textarea.selectionStart;
  const end   = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end);
  const newVal =
    textarea.value.slice(0, start) +
    before + selected + after +
    textarea.value.slice(end);
  return { newVal, cursor: start + before.length + selected.length + after.length };
}

function insertLinePrefix(textarea, prefix) {
  const start = textarea.selectionStart;
  const lineStart = textarea.value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd   = textarea.value.indexOf('\n', start);
  const end = lineEnd === -1 ? textarea.value.length : lineEnd;
  const line = textarea.value.slice(lineStart, end);

  // Toggle: if line already starts with prefix, remove it
  if (line.startsWith(prefix)) {
    const newVal = textarea.value.slice(0, lineStart) + line.slice(prefix.length) + textarea.value.slice(end);
    return { newVal, cursor: start - prefix.length };
  }
  const newVal = textarea.value.slice(0, lineStart) + prefix + line + textarea.value.slice(end);
  return { newVal, cursor: start + prefix.length };
}

/* ══════════════════════════════════════════════
   EDITOR MODAL
══════════════════════════════════════════════ */
function NoteEditor({ note, onClose, onUpdate, onDelete, onTogglePin }) {
  const [title,   setTitle]   = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [showPalette, setShowPalette] = useState(false);
  const [preview, setPreview] = useState(false);

  const textareaRef = useRef(null);
  const overlayRef  = useRef(null);
  const paletteRef  = useRef(null);

  // flush on close
  const flush = useCallback(() => {
    onUpdate(note.id, { title, content });
  }, [note.id, title, content, onUpdate]);

  useEffect(() => () => flush(), [flush]);

  // close palette on outside click
  useEffect(() => {
    if (!showPalette) return;
    const handler = (e) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        setShowPalette(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPalette]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) { flush(); onClose(); }
  };

  /* ── formatting helpers ── */
  const applyInline = (before, after = before) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { newVal, cursor } = wrapSelection(ta, before, after);
    setContent(newVal);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(cursor, cursor); }, 0);
  };

  const applyPrefix = (prefix) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { newVal, cursor } = insertLinePrefix(ta, prefix);
    setContent(newVal);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(cursor, cursor); }, 0);
  };

  const toolbarBtns = [
    { label: 'H1',     action: () => applyPrefix('# '),   icon: null, text: 'H1' },
    { label: 'H2',     action: () => applyPrefix('## '),  icon: null, text: 'H2' },
    { label: 'Normal', action: () => applyPrefix(''),     icon: null, text: 'Aa' },
    { label: 'Bold',        action: () => applyInline('**'),      icon: Bold },
    { label: 'Italic',      action: () => applyInline('_'),       icon: Italic },
    { label: 'Underline',   action: () => applyInline('<u>', '</u>'), icon: Underline },
    { label: 'Strikethrough', action: () => applyInline('~~'),    icon: Strikethrough },
  ];

  return (
    <div ref={overlayRef} className={styles.overlay} onClick={handleOverlayClick}>
      <div
        className={styles.editor}
        style={{ background: note.color }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* title row */}
        <div className={styles.editorTitleRow}>
          <input
            autoFocus
            className={styles.editorTitle}
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            className={styles.iconBtn}
            title={note.pinned ? 'Unpin' : 'Pin note'}
            onClick={() => onTogglePin(note.id)}
          >
            {note.pinned ? <PinOff size={17} /> : <Pin size={17} />}
          </button>
        </div>

        {/* formatting toolbar */}
        <div className={styles.formatBar}>
          {toolbarBtns.map((btn) => (
            <button
              key={btn.label}
              className={styles.fmtBtn}
              title={btn.label}
              onMouseDown={(e) => { e.preventDefault(); btn.action(); }}
            >
              {btn.icon ? <btn.icon size={14} strokeWidth={2.2} /> : <span className={styles.fmtText}>{btn.text}</span>}
            </button>
          ))}
          <div className={styles.fmtDivider} />
          <button
            className={`${styles.fmtBtn} ${preview ? styles.fmtActive : ''}`}
            title="Toggle preview"
            onMouseDown={(e) => { e.preventDefault(); setPreview((p) => !p); }}
          >
            <span className={styles.fmtText}>MD</span>
          </button>
        </div>

        {/* content: edit or preview */}
        {preview ? (
          <div className={styles.mdPreview}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '*Nothing to preview*'}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            className={styles.editorContent}
            placeholder="Take a note…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={9}
          />
        )}

        {/* bottom toolbar */}
        <div className={styles.editorToolbar}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', position: 'relative' }}>
            {/* COLOR PALETTE — always visible */}
            <div ref={paletteRef} style={{ position: 'relative' }}>
              <button
                className={styles.iconBtn}
                title="Change color"
                onClick={() => setShowPalette((p) => !p)}
              >
                <Palette size={16} />
              </button>
              {showPalette && (
                <div className={styles.palette}>
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      className={styles.paletteColor}
                      style={{
                        background: c.value,
                        outline: note.color === c.value ? '2px solid var(--accent-bright)' : '1px solid var(--glass-border)',
                        outlineOffset: '2px',
                      }}
                      title={c.label}
                      onClick={() => {
                        onUpdate(note.id, { color: c.value });
                        setShowPalette(false);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <button
              className={styles.iconBtn}
              style={{ color: 'var(--status-error)' }}
              title="Delete note"
              onClick={() => { onDelete(note.id); onClose(); }}
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className={styles.editorDate} title="Created date">
              {formatDate(note.created_at || note.createdAt, { includeTime: true }) || 'Just now'}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => { flush(); onClose(); }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   NOTE CARD
══════════════════════════════════════════════ */
function NoteCard({ note, onClick, onDelete, onTogglePin }) {
  const createdDateStr = formatDate(note.created_at || note.createdAt, { short: true }) || 'Today';
  const fullCreatedDate = formatDate(note.created_at || note.createdAt, { includeTime: true });

  return (
    <div
      className={styles.card}
      style={{ background: note.color }}
      onClick={onClick}
    >
      {note.title && <p className={styles.cardTitle}>{note.title}</p>}
      {note.content && (
        <div className={styles.cardMd}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
        </div>
      )}
      <div className={styles.cardFooter}>
        <span className={styles.cardDate} title={`Created: ${fullCreatedDate}`}>
          {createdDateStr}
        </span>
        <div className={styles.cardActions}>
          <button
            className={styles.iconBtnSm}
            title={note.pinned ? 'Unpin' : 'Pin'}
            onClick={(e) => { e.stopPropagation(); onTogglePin(note.id); }}
          >
            {note.pinned ? <PinOff size={13} /> : <Pin size={13} />}
          </button>
          <button
            className={styles.iconBtnSm}
            style={{ color: 'var(--status-error)' }}
            title="Delete"
            onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function Notes() {
  const { user } = useAuthStore();
  const { notes, initUser, createNote, updateNote, deleteNote, togglePin } = useNotesStore();

  const [search,      setSearch]      = useState('');
  const [editingNote, setEditingNote] = useState(null);

  useEffect(() => {
    if (user?.id) initUser(user.id);
  }, [user?.id, initUser]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) => n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q)
    );
  }, [notes, search]);

  const pinned   = filtered.filter((n) => n.pinned);
  const unpinned = filtered.filter((n) => !n.pinned);

  // keep editingNote in sync with store (e.g. after color update)
  const liveEditNote = editingNote
    ? notes.find((n) => n.id === editingNote.id) || editingNote
    : null;

  return (
    <div className={styles.page}>
      {/* ── header ── */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.iconWrap}>
            <StickyNote size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className={styles.title}>Notes</h1>
            <p className={styles.subtitle}>{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <Search size={13} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.clearBtn} onClick={() => setSearch('')}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── composer — opens full editor on click ── */}
      <div className={styles.composerWrap}>
        <div
          className={styles.composerClosed}
          onClick={() => { const n = createNote(); setEditingNote(n); }}
        >
          <span>Take a note…</span>
          <Plus size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </div>
      </div>

      {/* ── empty state ── */}
      {notes.length === 0 && (
        <div className={styles.empty}>
          <StickyNote size={48} strokeWidth={1.2} color="var(--text-muted)" />
          <p>No notes yet. Click above to take your first note.</p>
        </div>
      )}

      {/* ── pinned ── */}
      {pinned.length > 0 && (
        <section className={styles.section}>
          <p className={styles.sectionLabel}>PINNED</p>
          <div className={styles.grid}>
            {pinned.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => setEditingNote(note)}
                onDelete={deleteNote}
                onTogglePin={togglePin}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── others ── */}
      {unpinned.length > 0 && (
        <section className={styles.section}>
          {pinned.length > 0 && <p className={styles.sectionLabel}>OTHERS</p>}
          <div className={styles.grid}>
            {unpinned.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => setEditingNote(note)}
                onDelete={deleteNote}
                onTogglePin={togglePin}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── editor modal ── */}
      {liveEditNote && (
        <NoteEditor
          note={liveEditNote}
          onClose={() => setEditingNote(null)}
          onUpdate={updateNote}
          onDelete={deleteNote}
          onTogglePin={togglePin}
        />
      )}
    </div>
  );
}
