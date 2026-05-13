import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { MenuItem } from '@qrmenu/ui';
import { TagBadge, formatPrice, Z_INDEX, ANIMATION, getImageObjectPosition, getCleanImageUrl } from '@qrmenu/ui';

// iOS-like spring easing for snap transitions
const SNAP_TRANSITION = 'transform 0.42s cubic-bezier(0.32,0.72,0,1), height 0.42s cubic-bezier(0.32,0.72,0,1), border-radius 0.3s ease';

interface ItemModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export default function ItemModal({ item, onClose }: ItemModalProps) {
  const { t } = useTranslation();

  const [snapPoint,   setSnapPoint]   = useState<'default' | 'fullscreen'>('default');
  const [dragY,       setDragY]       = useState(0);
  const [isDragging,  setIsDragging]  = useState(false);
  const dragStartClientY = useRef(0);

  // Reset state when sheet opens for a new item
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

  // ── Drag handle pointer events ──────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartClientY.current = e.clientY;
    setDragY(0);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const delta = e.clientY - dragStartClientY.current;
    setDragY(delta);
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
      if (delta > vh * 0.12) {
        setSnapPoint('default');
      }
    }
    setDragY(0);
  };

  const isFullscreen = snapPoint === 'fullscreen';

  return (
    <AnimatePresence>
      {item && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: ANIMATION.fadeMs }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(26,18,8,0.5)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: Z_INDEX.modal,
            }}
          />

          {/*
            Outer motion.div — ONLY handles AnimatePresence enter/exit.
            No height, no background — just positioning wrapper.
          */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: Z_INDEX.modalInner,
              maxWidth: 600,
              margin: '0 auto',
            }}
          >
            {/*
              Inner div — handles snap state + drag offset.
              CSS transition runs on release; none while dragging.
            */}
            <div
              style={{
                height: isFullscreen ? '100dvh' : '92dvh',
                background: 'var(--cream-surface)',
                borderRadius: '20px 20px 0 0',
                boxShadow: 'var(--shadow-modal)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transform: `translateY(${dragY}px)`,
                transition: isDragging ? 'none' : SNAP_TRANSITION,
              }}
            >
              {/* ═══ DRAG ZONE — entire top area is draggable ═══ */}
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                style={{
                  flexShrink: 0,
                  cursor: isDragging ? 'grabbing' : 'grab',
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  paddingTop: 12,
                  position: 'relative',
                }}
              >
                {/* Visual drag handle bar */}
                <div style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: isDragging ? 'var(--ink-tertiary)' : 'var(--cream-border)',
                  margin: '0 auto 10px',
                  transition: 'background 0.15s',
                }} />

                {/* Buttons — top-right, stopPropagation prevents drag */}
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 12,
                    display: 'flex',
                    gap: 6,
                    zIndex: 3,
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => { setSnapPoint(p => p === 'fullscreen' ? 'default' : 'fullscreen'); setDragY(0); }}
                    title={isFullscreen ? 'Свернуть' : 'На весь экран'}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(26,18,8,0.08)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      color: 'var(--ink-primary)',
                    }}
                  >
                    {isFullscreen ? '⊡' : '⊞'}
                  </button>
                  <button
                    onClick={onClose}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(26,18,8,0.08)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      color: 'var(--ink-primary)',
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Photo — inside drag zone, swipe on photo drags the modal */}
                {item.image_url ? (
                  <div style={{
                    width: '100%',
                    paddingTop: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }}>
                    <img
                      src={getCleanImageUrl(item.image_url) ?? undefined}
                      alt={item.name}
                      loading="lazy"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: getImageObjectPosition(item.image_url),
                        display: 'block',
                        pointerEvents: 'none',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    height: 160,
                    background: 'linear-gradient(135deg, var(--cream-muted) 0%, var(--cream-border) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 64,
                    pointerEvents: 'none',
                  }}>
                    🍽️
                  </div>
                )}
              </div>
              {/* ═══ END DRAG ZONE ═══ */}

              {/* ── Scrollable body ── */}
              <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', flex: 1 }}>
                {/* Content */}
                <div style={{ padding: '16px 20px 24px' }}>
                  {/* Tags */}
                  {(item.tags ?? []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {(item.tags ?? []).map((tag) => (
                        <TagBadge key={tag} tag={tag} />
                      ))}
                    </div>
                  )}

                  {/* Name */}
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    fontWeight: 600,
                    color: 'var(--ink-primary)',
                    lineHeight: 1.25,
                    marginBottom: 10,
                  }}>
                    {item.name}
                  </div>

                  {/* Description */}
                  {item.description && (
                    <div style={{
                      fontSize: 13,
                      color: 'var(--ink-secondary)',
                      lineHeight: 1.6,
                      marginBottom: 16,
                      fontFamily: 'var(--font-ui)',
                    }}>
                      {item.description}
                    </div>
                  )}

                  {/* Divider */}
                  <div style={{ height: '0.5px', background: 'var(--cream-border)', marginBottom: 16 }} />

                  {/* Bottom row: prep time + price */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {item.preparation_time ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        color: 'var(--ink-secondary)',
                        fontFamily: 'var(--font-ui)',
                      }}>
                        <span>⏱</span>
                        <span>~{item.preparation_time} {t('menu.minutes')}</span>
                      </div>
                    ) : <div />}

                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 24,
                      fontWeight: 600,
                      color: 'var(--ink-primary)',
                    }}>
                      {formatPrice(item.price)}
                    </div>
                  </div>

                  {/* Unavailable notice */}
                  {!item.is_available && (
                    <div style={{
                      marginTop: 12,
                      padding: '10px 14px',
                      background: 'var(--cream-muted)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      color: 'var(--ink-secondary)',
                      fontFamily: 'var(--font-ui)',
                      textAlign: 'center',
                    }}>
                      {t('menu.temporarilyUnavailable')}
                    </div>
                  )}

                  {/* iOS safe area */}
                  <div style={{ height: 'env(safe-area-inset-bottom, 8px)' }} />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
