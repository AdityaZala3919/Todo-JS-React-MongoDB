import { useState } from "react";
import { 
  Zap, AlertTriangle, TrendingUp, ShieldAlert, Plus, 
  Edit3, Trash2, Sparkles, ChevronDown 
} from "lucide-react";
import { useSWOTStore } from "../../stores/swotStore";
import { toast } from "../UI/Toast";
import styles from "./QuadrantCard.module.css";

const QUADRANT_CONFIG = {
  strengths: {
    title: "Strengths",
    subtitle: "Internal Advantages & Superpowers",
    icon: Zap,
    actionVerb: "Leverage into Task",
    statusOptions: [
      { key: "identified", label: "Identified" },
      { key: "in_action", label: "In Action" },
      { key: "leveraged", label: "Leveraged" },
    ],
  },
  weaknesses: {
    title: "Weaknesses",
    subtitle: "Internal Friction & Skill Gaps",
    icon: AlertTriangle,
    actionVerb: "Convert to Improvement Task",
    statusOptions: [
      { key: "identified", label: "Identified" },
      { key: "in_action", label: "In Action" },
      { key: "mitigated", label: "Mitigated" },
    ],
  },
  opportunities: {
    title: "Opportunities",
    subtitle: "External Trends & Catalysts",
    icon: TrendingUp,
    actionVerb: "Seize with Action Item",
    statusOptions: [
      { key: "identified", label: "Identified" },
      { key: "in_action", label: "In Action" },
      { key: "leveraged", label: "Capitalized" },
    ],
  },
  threats: {
    title: "Threats",
    subtitle: "External Obstacles & Risks",
    icon: ShieldAlert,
    actionVerb: "Create Mitigation Plan",
    statusOptions: [
      { key: "identified", label: "Identified" },
      { key: "in_action", label: "In Action" },
      { key: "mitigated", label: "Neutralized" },
    ],
  },
};

export default function QuadrantCard({ quadrant, items, onEditItem }) {
  const config = QUADRANT_CONFIG[quadrant] || QUADRANT_CONFIG.strengths;
  const Icon = config.icon;
  const { addItem, deleteItem, updateItem, convertItemToTask } = useSWOTStore();

  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickImpact, setQuickImpact] = useState("medium");
  const [quickCategory, setQuickCategory] = useState("General");

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    addItem({
      quadrant,
      title: quickTitle.trim(),
      impact: quickImpact,
      category: quickCategory,
    });

    setQuickTitle("");
    setShowInlineAdd(false);
    toast.success(`Added to ${config.title}`);
  };

  const handleConvertToTask = (item) => {
    const task = convertItemToTask(item.id);
    if (task) {
      toast.success(`Task created: "${task.title.slice(0, 30)}..."`);
    }
  };

  const handleCycleStatus = (item) => {
    const opts = config.statusOptions.map((o) => o.key);
    const currentIndex = opts.indexOf(item.status);
    const nextIndex = (currentIndex + 1) % opts.length;
    const nextStatus = opts[nextIndex];
    updateItem(item.id, { status: nextStatus });
  };

  return (
    <div className={`${styles.card} ${styles[quadrant]}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.quadIcon}>
            <Icon size={18} strokeWidth={2.2} />
          </div>
          <div className={styles.titleArea}>
            <div className={styles.title}>
              <span>{config.title}</span>
              <span className={styles.badge}>{items.length}</span>
            </div>
            <span className={styles.subtitle}>{config.subtitle}</span>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.quickAddBtn}
            onClick={() => setShowInlineAdd((prev) => !prev)}
            title={`Add new ${config.title.slice(0, -1)}`}
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </div>
      </div>

      {showInlineAdd && (
        <form className={styles.inlineAdd} onSubmit={handleQuickSubmit}>
          <div className={styles.inlineInputRow}>
            <input
              type="text"
              className={styles.inlineInput}
              placeholder={`Add ${config.title.slice(0, -1).toLowerCase()}...`}
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.inlineOptions}>
            <div style={{ display: "flex", gap: 6 }}>
              <div className={styles.inlineSelectWrapper}>
                <select
                  className={styles.inlineSelect}
                  value={quickImpact}
                  onChange={(e) => setQuickImpact(e.target.value)}
                >
                  <option value="high">High Impact</option>
                  <option value="medium">Medium Impact</option>
                  <option value="low">Low Impact</option>
                </select>
                <ChevronDown size={11} className={styles.inlineSelectIcon} />
              </div>

              <div className={styles.inlineSelectWrapper}>
                <select
                  className={styles.inlineSelect}
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                >
                  <option value="General">General</option>
                  <option value="Technical">Technical</option>
                  <option value="Habits">Habits</option>
                  <option value="Mindset">Mindset</option>
                  <option value="Career">Career</option>
                  <option value="Health">Health</option>
                </select>
                <ChevronDown size={11} className={styles.inlineSelectIcon} />
              </div>
            </div>
            <div className={styles.inlineButtons}>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowInlineAdd(false)}>
                Cancel
              </button>
              <button type="submit" className={styles.submitBtn}>
                Save
              </button>
            </div>
          </div>
        </form>
      )}

      <div className={styles.itemList}>
        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <Icon size={28} className={styles.emptyIcon} />
            <p>No items added yet</p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowInlineAdd(true)}
              style={{ marginTop: 4 }}
            >
              + Quick Add
            </button>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <h4 className={styles.itemTitle}>{item.title}</h4>
                <div className={styles.itemActions}>
                  <button
                    className={styles.actionIconBtn}
                    onClick={() => onEditItem(item)}
                    title="Edit details"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    className={styles.actionIconBtn}
                    onClick={() => {
                      deleteItem(item.id);
                      toast.success("Item deleted");
                    }}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {item.description && (
                <p className={styles.itemDesc}>{item.description}</p>
              )}

              <div className={styles.itemMeta}>
                <div className={styles.tagsGroup}>
                  <span
                    className={`${styles.impactBadge} ${
                      item.impact === "high"
                        ? styles.impactHigh
                        : item.impact === "medium"
                        ? styles.impactMedium
                        : styles.impactLow
                    }`}
                  >
                    {item.impact}
                  </span>
                  {item.category && (
                    <span className={styles.categoryTag}>#{item.category}</span>
                  )}
                  <button
                    type="button"
                    className={`${styles.statusPill} ${styles[`status_${item.status || "identified"}`]}`}
                    onClick={() => handleCycleStatus(item)}
                    title="Click to cycle status"
                  >
                    {item.status === "in_action" ? "● In Action" : item.status === "leveraged" || item.status === "mitigated" ? "✓ Resolved" : "○ Identified"}
                  </button>
                </div>

                <button
                  className={`${styles.actionTaskBtn} ${item.linkedTaskId ? styles.linked : ""}`}
                  onClick={() => handleConvertToTask(item)}
                  title="Generate actionable Todo item in your task list"
                >
                  <Sparkles size={11} />
                  <span>{item.linkedTaskId ? "Task Linked ✓" : "Turn into Task"}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
