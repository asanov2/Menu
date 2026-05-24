import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { MenuItem } from '@qrmenu/ui';
import { TagBadge, formatPrice, Z_INDEX, ANIMATION, getImageObjectPosition, getCleanImageUrl } from '@qrmenu/ui';
import styles from './ItemModal.module.css';

const SNAP_TRANSITION = 'transform 0.42s cubic-bezier(0.32,0.72,0,1), height 0.42s cubic-bezier(0.32,0.72,0,1), border-radius 0.3s ease';

interface ItemModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export default function ItemModal({ item, onClose }: ItemModalProps) {
  const { t } = useTranslation();

  const [snapPoint,  setSnapPoint]  = useState<'default' | 'fullscreen'>('default');
  const [dragY,      setDragY]      = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartClientY = useRef(0);

  useEffect(() => {
    if (item) {
      setSnapPoint('default');
      setDragY(0);
      setIsDragging(false);
    }
  }, [item]);

  useEffect(() => {
    document.body.style.overflow = item ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [item]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartClientY.current = e.clientY;
    setDragY(0);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragY(e.clientY - dragStartClientY.current);
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
    setDragY(0);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const delta = e.clientY - dragStartClientY.current;
    const vh = window.innerHeight;

    if (snapPoint === 'default') {
      if (delta < -vh * 0.12) {
        setSnapPoint('fullscreen');
      } else if (delta > vh * 0.15) {
        onClose();
        return;
      }
    } else {
      if (delta > vh * 0.12) setSnapPoint('default');
    }
    setDragY(0);
  };

  const isFullscreen = snapPoint === 'fullscreen';

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: ANIMATION.fadeMs }}
            onClick={onClose}
            className={styles.backdrop}
            style={{ zIndex: Z_INDEX.modal }}
          />

          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={styles.sheetOuter}
            style={{ zIndex: Z_INDEX.modalInner }}
          >
            <div
              className={styles.sheetInner}
              style={{
                height: isFullscreen ? '100dvh' : '92dvh',
                transform: `translateY(${dragY}px)`,
                transition: isDragging ? 'none' : SNAP_TRANSITION,
              }}
            >
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                className={styles.dragZone}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <div className={`${styles.handleBar} ${isDragging ? styles.handleBarDragging : ''}`} />

                <div
                  className={styles.headerBtns}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => { setSnapPoint(p => p === 'fullscreen' ? 'default' : 'fullscreen'); setDragY(0); }}
                    title={isFullscreen ? 'Свернуть' : 'На весь экран'}
                    className={styles.iconBtn}
                  >
                    {isFullscreen ? '⊡' : '⊞'}
                  </button>
                  <button onClick={onClose} className={`${styles.iconBtn} ${styles.iconBtnClose}`}>
                    <i className="ti ti-x" style={{ fontSize: 16 }} />
                  </button>
                </div>

                {item.image_url ? (
                  <div
                    className={styles.photoContainer}
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                  >
                    <img
                      src={getCleanImageUrl(item.image_url) ?? undefined}
                      alt={item.name}
                      loading="lazy"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      className={styles.photo}
                      style={{ objectPosition: getImageObjectPosition(item.image_url) }}
                    />
                  </div>
                ) : (
                  <div className={styles.photoPlaceholder}><i className="ti ti-tools-kitchen-2" style={{ fontSize: 48 }} /></div>
                )}
              </div>

              <div className={styles.scrollBody}>
                <div className={styles.content}>
                  {(item.tags ?? []).length > 0 && (
                    <div className={styles.tagsRow}>
                      {(item.tags ?? []).map((tag) => (
                        <TagBadge key={tag} tag={tag} />
                      ))}
                    </div>
                  )}

                  <div className={styles.itemName}>{item.name}</div>

                  {item.description && (
                    <div className={styles.itemDesc}>{item.description}</div>
                  )}

                  {item.calories != null && (
                    <div className={styles.nutritionRow}>
                      <i className="ti ti-flame" style={{ fontSize: 12, flexShrink: 0 }} />
                      <span>~{item.calories} ккал</span>
                      {item.protein != null && (
                        <span className={styles.nutritionChip}>Б {item.protein} г</span>
                      )}
                      {item.fat != null && (
                        <span className={styles.nutritionChip}>Ж {item.fat} г</span>
                      )}
                      {item.carbs != null && (
                        <span className={styles.nutritionChip}>У {item.carbs} г</span>
                      )}
                      <span className={styles.nutritionPer}>на 100 г</span>
                    </div>
                  )}

                  <div className={styles.divider} />

                  <div className={styles.bottomRow}>
                    {item.preparation_time ? (
                      <div className={styles.prepTime}>
                        <span>⏱</span>
                        <span>~{item.preparation_time} {t('menu.minutes')}</span>
                      </div>
                    ) : <div />}

                    <div className={styles.itemPrice}>{formatPrice(item.price)}</div>
                  </div>

                  {!item.is_available && (
                    <div className={styles.unavailableNotice}>
                      {t('menu.temporarilyUnavailable')}
                    </div>
                  )}

                  <div className={styles.safeArea} />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
