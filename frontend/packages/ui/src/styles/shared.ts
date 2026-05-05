import type { CSSProperties } from 'react';

export const INPUT_STYLE: CSSProperties = {
  width: '100%',
  background: 'var(--cream-surface)',
  border: '0.5px solid var(--cream-border)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 12px',
  fontSize: 13,
  fontFamily: 'var(--font-ui)',
  outline: 'none',
  boxSizing: 'border-box',
  color: 'var(--ink-primary)',
};

export const CARD_STYLE: CSSProperties = {
  background: 'var(--cream-surface)',
  border: '0.5px solid var(--cream-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '20px 24px',
  boxShadow: 'var(--shadow-card)',
};

export const LABEL_STYLE: CSSProperties = {
  fontSize: 11,
  fontFamily: 'var(--font-ui)',
  color: 'var(--ink-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 4,
  display: 'block',
};

export const SECTION_HEADING_STYLE: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 18,
  color: 'var(--ink-primary)',
  marginBottom: 16,
};

export const OVERLAY_STYLE: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(26,18,8,0.5)',
  zIndex: 300,
};
