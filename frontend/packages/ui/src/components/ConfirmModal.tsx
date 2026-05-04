import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Удалить',
  cancelText = 'Отмена',
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onCancel}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(26,18,8,0.5)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 200,
            }}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 48px)',
              maxWidth: 380,
              background: 'var(--cream-surface)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px 24px 20px',
              zIndex: 201,
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 600,
                color: 'var(--ink-primary)',
                marginBottom: 10,
                lineHeight: 1.25,
              }}
            >
              {title}
            </div>

            <div
              style={{
                fontSize: 14,
                color: 'var(--ink-secondary)',
                lineHeight: 1.6,
                marginBottom: 24,
                fontFamily: 'var(--font-ui)',
              }}
            >
              {message}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={onCancel}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'var(--font-ui)',
                  background: 'var(--cream-muted)',
                  color: 'var(--ink-secondary)',
                  border: '0.5px solid var(--cream-border)',
                  cursor: 'pointer',
                  minHeight: 40,
                }}
              >
                {cancelText}
              </button>

              <button
                onClick={onConfirm}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'var(--font-ui)',
                  background: danger ? 'var(--error-text)' : 'var(--ink-primary)',
                  color: 'var(--cream-surface)',
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: 40,
                }}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
