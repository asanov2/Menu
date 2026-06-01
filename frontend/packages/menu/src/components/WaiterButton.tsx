import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@qrmenu/ui';
import { callWaiter } from '../api/menu';
import styles from './WaiterButton.module.css';

const COOLDOWN_MS = 60_000;

// ── localStorage helpers ──────────────────────────────────────────────────────

/** Key tracking the last successful call — used to restore FAB checkmark on F5. */
const lastCalledKey = (slug: string, menuId?: string) =>
  `waiter_last:${slug}:${menuId ?? '-'}`;

/** Per-table cooldown key — used to disable the confirm button for a specific table. */
const tableCdKey = (slug: string, menuId: string | undefined, table: number) =>
  `waiter_cd:${slug}:${menuId ?? '-'}:${table}`;

function readTs(key: string): number {
  try { return Number(localStorage.getItem(key) ?? 0); } catch { return 0; }
}

// ─────────────────────────────────────────────────────────────────────────────

interface WaiterButtonProps {
  slug: string;
  menuId?: string;
  tablesCount: number;
}

type Stage = 'idle' | 'modal' | 'loading' | 'success' | 'error';

export default function WaiterButton({ slug, menuId, tablesCount }: WaiterButtonProps) {
  // Restore 'success' (FAB checkmark) from localStorage on mount
  const [stage, setStage] = useState<Stage>(() => {
    const ts = readTs(lastCalledKey(slug, menuId));
    return ts && (Date.now() - ts) < COOLDOWN_MS ? 'success' : 'idle';
  });
  const [tableNumber, setTableNumber] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [tableOnCooldown, setTableOnCooldown] = useState(false);
  const [secsLeft, setSecsLeft] = useState(0);

  // On mount: schedule FAB → idle when remaining cooldown expires
  useEffect(() => {
    const lk = lastCalledKey(slug, menuId);
    const ts = readTs(lk);
    if (!ts) return;
    const remaining = COOLDOWN_MS - (Date.now() - ts);
    if (remaining <= 0) { localStorage.removeItem(lk); return; }
    const t = setTimeout(() => {
      localStorage.removeItem(lk);
      setStage('idle');
    }, remaining);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Per-table cooldown: active only while modal is open, re-runs on table change
  useEffect(() => {
    if (stage !== 'modal') {
      setTableOnCooldown(false);
      setSecsLeft(0);
      return;
    }
    const tk = tableCdKey(slug, menuId, tableNumber);
    const ts = readTs(tk);
    const remaining = ts ? COOLDOWN_MS - (Date.now() - ts) : 0;

    if (remaining <= 0) {
      if (ts) localStorage.removeItem(tk);
      setTableOnCooldown(false);
      setSecsLeft(0);
      return;
    }

    setTableOnCooldown(true);
    setSecsLeft(Math.ceil(remaining / 1000));

    const iv = setInterval(() => {
      const t2 = readTs(tableCdKey(slug, menuId, tableNumber));
      const r = t2 ? COOLDOWN_MS - (Date.now() - t2) : 0;
      if (r <= 0) {
        clearInterval(iv);
        localStorage.removeItem(tableCdKey(slug, menuId, tableNumber));
        setTableOnCooldown(false);
        setSecsLeft(0);
      } else {
        setSecsLeft(Math.ceil(r / 1000));
      }
    }, 1000);

    return () => clearInterval(iv);
  }, [tableNumber, stage, slug, menuId]);

  const openModal = () => {
    if (stage === 'success') return;
    setTableNumber(1);
    setErrorMsg('');
    setStage('modal');
  };

  const closeModal = () => setStage('idle');

  /** Save cooldown to localStorage and start the FAB success state. */
  const startCooldown = (table: number) => {
    const now = String(Date.now());
    try { localStorage.setItem(tableCdKey(slug, menuId, table), now); } catch {}
    try { localStorage.setItem(lastCalledKey(slug, menuId), now); } catch {}
    setStage('success');
    setTimeout(() => {
      try { localStorage.removeItem(lastCalledKey(slug, menuId)); } catch {}
      setStage('idle');
    }, COOLDOWN_MS);
  };

  const handleConfirm = async () => {
    setStage('loading');
    try {
      await callWaiter(slug, tableNumber, menuId);
      startCooldown(tableNumber);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 429) {
        // Backend cooldown active — treat as success (someone already called)
        startCooldown(tableNumber);
      } else {
        setErrorMsg('Не удалось отправить вызов. Попробуйте ещё раз.');
        setStage('error');
      }
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
            <div className={styles.modalWrapper}>
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
                    <select
                      className={styles.select}
                      value={tableNumber}
                      onChange={(e) => setTableNumber(Number(e.target.value))}
                      disabled={isLoading}
                    >
                      {Array.from({ length: tablesCount }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>Стол {n}</option>
                      ))}
                    </select>
                    <button
                      className={styles.btnConfirm}
                      onClick={handleConfirm}
                      disabled={isLoading || tableOnCooldown}
                    >
                      {isLoading
                        ? 'Отправляю...'
                        : tableOnCooldown
                        ? `Подождите ${secsLeft} сек`
                        : 'Вызвать официанта'}
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
