import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@qrmenu/ui';
import { callWaiter } from '../api/menu';
import styles from './WaiterButton.module.css';

const COOLDOWN_MS = 60_000;

interface WaiterButtonProps {
  slug: string;
  menuId?: string;
  tablesCount: number;
}

type Stage = 'idle' | 'modal' | 'loading' | 'success' | 'error';

export default function WaiterButton({ slug, menuId, tablesCount }: WaiterButtonProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [tableNumber, setTableNumber] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');

  const openModal = () => {
    if (stage === 'success') return;
    setTableNumber(1);
    setErrorMsg('');
    setStage('modal');
  };

  const closeModal = () => setStage('idle');

  const handleConfirm = async () => {
    setStage('loading');
    try {
      await callWaiter(slug, tableNumber, menuId);
      setStage('success');
      setTimeout(() => setStage('idle'), COOLDOWN_MS);
    } catch {
      setErrorMsg('Не удалось отправить вызов. Попробуйте ещё раз.');
      setStage('error');
    }
  };

  const handleRetry = () => {
    setErrorMsg('');
    setStage('modal');
  };

  const isCooldown = stage === 'success';
  const isLoading = stage === 'loading';

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={openModal}
        whileTap={{ scale: isCooldown || isLoading ? 1 : 0.88 }}
        className={`${styles.btn} ${isCooldown ? styles.btnCalled : ''} ${isLoading ? styles.btnLoading : ''}`}
        aria-label="Вызвать официанта"
      >
        {isCooldown ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={styles.checkmark}
          >
            <Icon name="check" size={22} />
          </motion.span>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
              stroke="var(--accent-gold)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </motion.button>

      {/* Modal overlay */}
      <AnimatePresence>
        {(stage === 'modal' || stage === 'loading' || stage === 'error') && (
          <>
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={closeModal}
            />
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className={styles.modalHeader}>
                <Icon name="bell-ringing" size={18} />
                <span className={styles.modalTitle}>Вызвать официанта</span>
                <button className={styles.closeBtn} onClick={closeModal} aria-label="Закрыть">
                  <Icon name="x" size={16} />
                </button>
              </div>

              {stage === 'error' ? (
                <div className={styles.modalBody}>
                  <p className={styles.errorText}>{errorMsg}</p>
                  <button className={styles.btnConfirm} onClick={handleRetry}>
                    Попробовать снова
                  </button>
                </div>
              ) : (
                <div className={styles.modalBody}>
                  <label className={styles.tableLabel}>За каким вы столом?</label>
                  <div className={styles.tableStepper}>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => setTableNumber((n) => Math.max(1, n - 1))}
                      disabled={tableNumber <= 1 || isLoading}
                      aria-label="Предыдущий стол"
                    >
                      <Icon name="chevron-left" size={20} />
                    </button>
                    <span className={styles.tableValue}>Стол {tableNumber}</span>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => setTableNumber((n) => Math.min(tablesCount, n + 1))}
                      disabled={tableNumber >= tablesCount || isLoading}
                      aria-label="Следующий стол"
                    >
                      <Icon name="chevron-right" size={20} />
                    </button>
                  </div>
                  <button
                    className={styles.btnConfirm}
                    onClick={handleConfirm}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Отправляю...' : 'Вызвать официанта'}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
