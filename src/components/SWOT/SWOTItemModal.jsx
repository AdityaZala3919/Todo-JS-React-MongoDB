import { useState, useEffect } from "react";
import { X, Zap, AlertTriangle, TrendingUp, ShieldAlert } from "lucide-react";
import { useSWOTStore } from "../../stores/swotStore";
import { toast } from "../UI/Toast";
import styles from "./SWOTItemModal.module.css";

const QUADRANTS = [
  { key: "strengths", label: "Strengths (S)", icon: Zap, color: "#10b981" },
  { key: "weaknesses", label: "Weaknesses (W)", icon: AlertTriangle, color: "#f59e0b" },
  { key: "opportunities", label: "Opportunities (O)", icon: TrendingUp, color: "#38bdf8" },
  { key: "threats", label: "Threats (T)", icon: ShieldAlert, color: "#f43f5e" },
];

export default function SWOTItemModal({ item, initialQuadrant = "strengths", onClose }) {
  const { addItem, updateItem } = useSWOTStore();

  const [quadrant, setQuadrant] = useState(initialQuadrant);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState("medium");
  const [category, setCategory] = useState("General");
  const [status, setStatus] = useState("identified");

  useEffect(() => {
    if (item) {
      setQuadrant(item.quadrant);
      setTitle(item.title || "");
      setDescription(item.description || "");
      setImpact(item.impact || "medium");
      setCategory(item.category || "General");
      setStatus(item.status || "identified");
    } else {
      setQuadrant(initialQuadrant);
    }
  }, [item, initialQuadrant]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (item) {
      updateItem(item.id, {
        quadrant,
        title: title.trim(),
        description: description.trim(),
        impact,
        category,
        status,
      });
      toast.success("Updated successfully");
    } else {
      addItem({
        quadrant,
        title: title.trim(),
        description: description.trim(),
        impact,
        category,
      });
      toast.success("Added new insight");
    }
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>
            {item ? "Edit SWOT Item" : "New SWOT Reflection"}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            <div className={styles.field}>
              <label className={styles.label}>Select Quadrant</label>
              <div className={styles.quadrantSelector}>
                {QUADRANTS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.quadOption} ${quadrant === key ? styles[`active_${key}`] : ""}`}
                    onClick={() => setQuadrant(key)}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Title / Insight</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Fast problem solving under pressure"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Impact Level</label>
                <select
                  className="input"
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                >
                  <option value="high">High Impact</option>
                  <option value="medium">Medium Impact</option>
                  <option value="low">Low Impact</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Category / Domain</label>
                <select
                  className="input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="General">General</option>
                  <option value="Technical">Technical</option>
                  <option value="Habits">Habits</option>
                  <option value="Mindset">Mindset</option>
                  <option value="Career">Career</option>
                  <option value="Health">Health</option>
                  <option value="Networking">Networking</option>
                  <option value="Process">Process</option>
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Detailed Notes & Context</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Explain the background, why this matters, or specific examples..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {item && (
              <div className={styles.field}>
                <label className={styles.label}>Current Status</label>
                <select
                  className="input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="identified">Identified (Recognized)</option>
                  <option value="in_action">In Action (Active Task Linked)</option>
                  <option value="leveraged">Leveraged / Mitigated (Resolved)</option>
                </select>
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {item ? "Save Changes" : "Add Insight"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
