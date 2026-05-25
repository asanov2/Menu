import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { MenuItem } from '@qrmenu/ui';
import { TagBadge, Icon, formatPrice, Z_INDEX, ANIMATION, getImageObjectPosition, getCleanImageUrl } from '@qrmenu/ui';
import { ALLERGEN_MAP } from '../constants/allergens';
import styles from './ItemModal.module.css';

const SNAP_TRANSITION = 'transform 0.42s cubic-bezier(0.32,0.72,0,1), height 0.42s cubic-bezier(0.32,0.72,0,1), border-radius 0.3s ease';

interface ItemModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart?: (item: MenuItem) => void;
}

export default function ItemModal({ item, onClose, onAddToCart }: ItemModalProps) {
  const { t, i18n } = useTranslation();

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
  const showCartBtn = !!(onAddToCart && item?.is_available);

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
              {/* ─── Drag zone + photo ─── */}
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
                    <Icon name={isFullscreen ? 'minimize' : 'maximize'} size={15} />
                  </button>
                  <button onClick={onClose} className={`${styles.iconBtn} ${styles.iconBtnClose}`}>
                    <Icon name="x" size={16} />
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
                  <div className={styles.photoPlaceholder}>
                    <Icon name="tools-kitchen-2" size={48} />
                  </div>
                )}
              </div>

              {/* ─── Scrollable content ─── */}
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
                      <Icon name="flame" size={12} />
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

                  {(item.allergens ?? []).length > 0 && (
                    <div className={styles.allergenBlock}>
                      <div className={styles.allergenBlockTitle}>Аллергены</div>
                      <div className={styles.allergenList}>
                        {(item.allergens ?? []).map((code) => {
                          const info = ALLERGEN_MAP[code];
                          if (!info) return null;
                          const lang = i18n.language as 'ru' | 'kz' | 'en';
                          const name = lang === 'kz' ? info.name_kz : lang === 'en' ? info.name_en : info.name_ru;
                          return (
                            <span key={code} className={styles.allergenChip}>
                              <Icon name={info.icon} size={13} />
                              {name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className={styles.divider} />

                  <div className={styles.bottomRow}>
                    {item.preparation_time ? (
                      <div className={styles.prepTime}>
                        <Icon name="clock" size={12} />
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
                </div>
              </div>

              {/* ─── Sticky cart button — always outside scroll ─── */}
              {showCartBtn && (
                <div className={styles.cartFooter}>
                  <button
                    onClick={() => onAddToCart!(item)}
                    className={styles.addToCartBtn}
                  >
                    Добавить в корзину
                  </button>
                  <div className={styles.safeArea} />
                </div>
              )}
              {!showCartBtn && <div className={styles.safeArea} />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
