import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

let toastId = 0;
let addToastFn = null;

export function toast(message, type = 'info', action = null) {
  if (addToastFn) addToastFn({ id: ++toastId, message, type, action });
}
toast.success = (msg, action) => toast(msg, 'success', action);
toast.error = (msg, action) => toast(msg, 'error', action);

const icons = { success: CheckCircle2, error: XCircle, info: Info };

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  addToastFn = useCallback((t) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4000);
  }, []);

  return createPortal(
    <div className={styles.container}>
      {toasts.map((t) => {
        const Icon = icons[t.type] || Info;
        return (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
            <Icon size={16} />
            <span className={styles.message}>{t.message}</span>
            {t.action && <button className={styles.action} onClick={() => { t.action.fn(); setToasts((prev) => prev.filter((x) => x.id !== t.id)); }}>{t.action.label}</button>}
            <button className={styles.close} onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}><X size={14} /></button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
