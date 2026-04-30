import { CSSProperties } from 'react';
import { TagType } from '../../../types/menu';

interface TagConfig {
  emoji: string;
  label: string;
  style: CSSProperties;
}

const TAG_CONFIG: Record<TagType, TagConfig> = {
  popular: {
    emoji: '⭐',
    label: 'Хит',
    style: {
      background: 'var(--accent-gold-bg)',
      color: '#8B6914',
      border: '0.5px solid var(--accent-gold)',
    },
  },
  vegan: {
    emoji: '🌱',
    label: 'Веган',
    style: {
      background: 'var(--tag-green-bg)',
      color: 'var(--tag-green-text)',
      border: '0.5px solid var(--tag-green-border)',
    },
  },
  spicy: {
    emoji: '🌶',
    label: 'Острое',
    style: {
      background: 'var(--tag-red-bg)',
      color: 'var(--tag-red-text)',
      border: '0.5px solid var(--tag-red-border)',
    },
  },
  new: {
    emoji: '✨',
    label: 'Новое',
    style: {
      background: 'var(--tag-blue-bg)',
      color: 'var(--tag-blue-text)',
      border: '0.5px solid var(--tag-blue-border)',
    },
  },
  chef: {
    emoji: '👨‍🍳',
    label: 'Шеф',
    style: {
      background: 'var(--accent-gold-bg)',
      color: '#8B6914',
      border: '0.5px solid var(--accent-gold)',
    },
  },
};

interface TagBadgeProps {
  tag: TagType;
}

export default function TagBadge({ tag }: TagBadgeProps) {
  const config = TAG_CONFIG[tag];
  if (!config) return null;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '2px 7px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 500,
        lineHeight: '1.5',
        fontFamily: 'DM Sans, sans-serif',
        whiteSpace: 'nowrap',
        ...config.style,
      }}
    >
      <span style={{ fontSize: '9px', lineHeight: 1 }}>{config.emoji}</span>
      {config.label}
    </span>
  );
}
