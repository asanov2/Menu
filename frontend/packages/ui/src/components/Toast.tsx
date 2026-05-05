import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOAST_DURATION_MS, Z_INDEX } from '../constants';

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
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: Z_INDEX.toast,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxWidth: 320,
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: BG[toast.type],
                border: `1px solid ${BORDER[toast.type]}`,
                borderRadius: 'var(--radius-md)',
                color: COLOR[toast.type],
                fontSize: 13,
                fontFamily: 'var(--font-ui)',
                fontWeight: 500,
                boxShadow: 'var(--shadow-card)',
                pointerEvents: 'auto',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {ICON[toast.type]}
              </span>
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
