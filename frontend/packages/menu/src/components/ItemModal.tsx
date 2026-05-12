import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { MenuItem } from '@qrmenu/ui';
import { TagBadge, formatPrice, Z_INDEX, ANIMATION, getImageObjectPosition, getCleanImageUrl } from '@qrmenu/ui';

interface ItemModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export default function ItemModal({ item, onClose }: ItemModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    document.body.style.overflow = item ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [item]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

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

          {/* Bottom sheet */}
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
              width: '100%',
              maxWidth: 600,
              margin: '0 auto',
              background: 'var(--cream-surface)',
              borderRadius: '20px 20px 0 0',
              zIndex: Z_INDEX.modalInner,
              maxHeight: '92dvh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            {/* Drag handle */}
            <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--cream-border)' }} />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 12,
                right: 16,
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
                zIndex: 2,
              }}
            >
              ✕
            </button>

            {/* Scrollable body */}
            <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', flex: 1 }}>
              {/* Square image via paddingTop trick — always correct aspect ratio */}
              {item.image_url ? (
                <div style={{
                  width: '100%',
                  paddingTop: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  <img
                    src={getCleanImageUrl(item.image_url) ?? undefined}
                    alt={item.name}
                    loading="lazy"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: getImageObjectPosition(item.image_url),
                      display: 'block',
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  width: '100%',
                  height: 200,
                  background: 'linear-gradient(135deg, var(--cream-muted) 0%, var(--cream-border) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 64,
                  flexShrink: 0,
                }}>
                  🍽️
                </div>
              )}

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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
