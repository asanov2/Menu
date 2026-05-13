import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOAST_DURATION_MS } from '../constants';
import styles from './Toast.module.css';

type ToastType = 'success' | 'error' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

const ICON: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
};

const BG: Record<ToastType, string> = {
  success: 'var(--success-bg)',
  error: 'var(--error-bg)',
  warning: 'var(--warning-bg)',
};

const BORDER: Record<ToastType, string> = {
  success: 'var(--success-border)',
  error: 'var(--error-border)',
  warning: 'var(--warning-border)',
};

const COLOR: Record<ToastType, string> = {
  success: 'var(--success-text)',
  error: 'var(--error-text)',
  warning: 'var(--warning-text)',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.container}>
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={styles.toast}
              style={{
                background: BG[toast.type],
                border: `1px solid ${BORDER[toast.type]}`,
                color: COLOR[toast.type],
              }}
            >
              <span className={styles.icon}>{ICON[toast.type]}</span>
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
