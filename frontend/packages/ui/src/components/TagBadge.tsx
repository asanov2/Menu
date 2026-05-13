import type { CSSProperties } from 'react';
import styles from './TagBadge.module.css';

const RU_TO_EN: Record<string, string> = {
  'Хит':    'popular',
  'Веган':  'vegan',
  'Острое': 'spicy',
  'Новое':  'new',
  'Шеф':    'chef',
};

const TAG_MAP: Record<string, { emoji: string; label: string; style: CSSProperties }> = {
  popular: { emoji: '⭐',    label: 'Хит',    style: { background: 'var(--accent-gold-bg)', color: 'var(--accent-gold)', border: '0.5px solid var(--accent-gold-border)' } },
  vegan:   { emoji: '🌱',    label: 'Веган',  style: { background: 'var(--tag-green-bg)',   color: 'var(--tag-green-text)', border: '0.5px solid var(--tag-green-border)' } },
  spicy:   { emoji: '🌶',    label: 'Острое', style: { background: 'var(--tag-red-bg)',     color: 'var(--tag-red-text)', border: '0.5px solid var(--tag-red-border)' } },
  new:     { emoji: '✨',    label: 'Новое',  style: { background: 'var(--tag-blue-bg)',    color: 'var(--tag-blue-text)', border: '0.5px solid var(--tag-blue-border)' } },
  chef:    { emoji: '👨‍🍳', label: 'Шеф',   style: { background: 'var(--accent-gold-bg)', color: 'var(--accent-gold)', border: '0.5px solid var(--accent-gold-border)' } },
};

interface TagBadgeProps {
  tag: string;
}

export default function TagBadge({ tag }: TagBadgeProps) {
  const key = RU_TO_EN[tag] ?? tag;
  const config = TAG_MAP[key];
  if (!config) return null;

  return (
    <span className={styles.badge} style={config.style}>
      <span className={styles.emoji}>{config.emoji}</span>
      {config.label}
    </span>
  );
}
