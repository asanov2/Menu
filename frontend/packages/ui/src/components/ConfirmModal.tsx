import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ANIMATION } from '../constants';
import styles from './ConfirmModal.module.css';

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
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: ANIMATION.fadeMs }}
            className={styles.backdrop}
            onClick={onCancel}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -12 }}
            transition={ANIMATION.spring}
            className={styles.panel}
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <div className={styles.title}>{title}</div>

            <div className={styles.message}>{message}</div>

            <div className={styles.actions}>
              <button className={styles.btnCancel} onClick={onCancel}>
                {cancelText}
              </button>

              <button
                className={`${styles.btnConfirm} ${danger ? styles.btnConfirmDanger : ''}`}
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
