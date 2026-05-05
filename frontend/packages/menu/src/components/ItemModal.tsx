import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { MenuItem } from '@qrmenu/ui';
import { TagBadge, formatPrice, Z_INDEX, ANIMATION } from '@qrmenu/ui';

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

          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: 390,
              background: 'var(--cream-bg)',
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              zIndex: Z_INDEX.modalInner,
              maxHeight: '92dvh',
              overflowY: 'auto',
              paddingBottom: 'env(safe-area-inset-bottom, 24px)',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--cream-border)' }} />
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 12,
                right: 16,
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--cream-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                color: 'var(--ink-secondary)',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              ✕
            </button>

            {/* Image */}
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                loading="lazy"
                style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 240,
                  background: 'linear-gradient(135deg, var(--cream-muted) 0%, var(--cream-border) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 72,
                }}
              >
                🍽️
              </div>
            )}

            {/* Content */}
            <div style={{ padding: '16px 20px 8px' }}>
              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {item.tags.map((tag) => (
                  <TagBadge key={tag} tag={tag} />
                ))}
                {!item.is_available && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 9,
                      fontWeight: 500,
                      background: 'var(--cream-muted)',
                      color: 'var(--ink-secondary)',
                      border: '0.5px solid var(--cream-border)',
                    }}
                  >
                    Нет в наличии
                  </span>
                )}
              </div>

              {/* Name */}
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 24,
                  fontWeight: 600,
                  color: 'var(--ink-primary)',
                  lineHeight: 1.2,
                  marginBottom: 10,
                }}
              >
                {item.name}
              </div>

              {/* Description */}
              {item.description && (
                <div
                  style={{
                    fontSize: 14,
                    color: 'var(--ink-secondary)',
                    lineHeight: 1.65,
                    marginBottom: 16,
                    fontFamily: 'var(--font-ui)',
                  }}
                >
                  {item.description}
                </div>
              )}

              {/* Prep time */}
              {item.preparation_time && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    color: 'var(--ink-tertiary)',
                    marginBottom: 16,
                  }}
                >
                  <span>🕐</span>
                  <span>~{item.preparation_time} {t('menu.minutes')}</span>
                </div>
              )}

              {/* Price */}
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  color: 'var(--ink-primary)',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                {formatPrice(item.price)}
              </div>

              {/* Unavailable banner */}
              {!item.is_available && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '12px 16px',
                    background: 'var(--cream-muted)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    fontSize: 13,
                    color: 'var(--ink-secondary)',
                    fontFamily: 'var(--font-ui)',
                  }}
                >
                  {t('menu.temporarilyUnavailable')}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
