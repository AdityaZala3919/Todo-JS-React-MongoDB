import { useState } from "react";
import { Target, Plus, Trash2, ArrowUpRight, Lightbulb, Compass } from "lucide-react";
import { useSWOTStore } from "../../stores/swotStore";
import { toast } from "../UI/Toast";
import styles from "./TOWSMatrix.module.css";

const STRATEGY_QUADRANTS = [
  {
    type: "SO",
    title: "Maxi-Maxi Strategies",
    formula: "Strengths + Opportunities",
    description: "How can you deploy your strengths to aggressively capture external opportunities?",
    badgeClass: "typeSO",
  },
  {
    type: "WO",
    title: "Mini-Maxi Strategies",
    formula: "Weaknesses + Opportunities",
    description: "How can external opportunities help you remedy or bypass internal weaknesses?",
    badgeClass: "typeWO",
  },
  {
    type: "ST",
    title: "Maxi-Mini Strategies",
    formula: "Strengths + Threats",
    description: "How can your core strengths defend against and neutralize external threats?",
    badgeClass: "typeST",
  },
  {
    type: "WT",
    title: "Mini-Mini Strategies",
    formula: "Weaknesses + Threats",
    description: "Defensive moves to minimize weaknesses and insulate yourself against threats.",
    badgeClass: "typeWT",
  },
];

export default function TOWSMatrix() {
  const { getActiveBoard, addTOWSStrategy, deleteTOWSStrategy } = useSWOTStore();
  const activeBoard = getActiveBoard();
  const strategies = activeBoard?.towsStrategies || [];

  const [inputStates, setInputStates] = useState({
    SO: "",
    WO: "",
    ST: "",
    WT: "",
  });

  const handleAdd = (type) => {
    const text = inputStates[type]?.trim();
    if (!text) return;

    addTOWSStrategy({
      type,
      title: text,
      description: `Strategic action derived from ${type} analysis.`,
    });

    setInputStates((prev) => ({ ...prev, [type]: "" }));
    toast.success(`Strategy added for ${type}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.introBanner}>
        <div className={styles.introContent}>
          <div className={styles.introTitle}>
            <Compass size={20} color="var(--accent-bright)" />
            <span>TOWS Strategic Cross-Analysis</span>
          </div>
          <p className={styles.introText}>
            Cross-match your internal factors (Strengths & Weaknesses) with external dynamics (Opportunities & Threats) to formulate actionable offensive & defensive battle plans.
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        {STRATEGY_QUADRANTS.map(({ type, title, formula, description, badgeClass }) => {
          const typeStrats = strategies.filter((s) => s.type === type);
          return (
            <div key={type} className={styles.stratCard}>
              <div className={styles.cardHeader}>
                <div>
                  <span className={`${styles.cardTypeBadge} ${styles[badgeClass]}`}>
                    {type} STRATEGY
                  </span>
                  <h3 className={styles.cardTitle}>{title}</h3>
                  <span className={styles.cardFormula}>{formula}</span>
                </div>
              </div>

              <p style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                {description}
              </p>

              <div className={styles.stratList}>
                {typeStrats.length === 0 ? (
                  <div style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)", padding: "12px 0" }}>
                    No strategy initiatives defined yet.
                  </div>
                ) : (
                  typeStrats.map((strat) => (
                    <div key={strat.id} className={styles.stratItem}>
                      <div className={styles.stratItemTitle}>
                        <span>{strat.title}</span>
                        <button
                          className="btn-ghost btn-sm"
                          style={{ padding: "2px 4px" }}
                          onClick={() => {
                            deleteTOWSStrategy(strat.id);
                            toast.success("Strategy removed");
                          }}
                          title="Delete strategy"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      {strat.description && (
                        <p className={styles.stratItemDesc}>{strat.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className={styles.addStratRow}>
                <input
                  type="text"
                  className={styles.addStratInput}
                  placeholder={`Add ${type} strategic initiative...`}
                  value={inputStates[type]}
                  onChange={(e) =>
                    setInputStates((prev) => ({ ...prev, [type]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd(type);
                  }}
                />
                <button
                  type="button"
                  className={`${styles.addStratBtn} ${styles[`btn${type}`]}`}
                  onClick={() => handleAdd(type)}
                >
                  <Plus size={13} strokeWidth={2.2} />
                  <span>Add</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
