import { CSSProperties } from 'react';

interface TagConfig {
  emoji: string;
  label: string;
  style: CSSProperties;
}

const TAG_MAP: Record<string, TagConfig> = {
  popular: {
    emoji: '⭐',
    label: 'Хит',
    style: {
      background: 'var(--accent-gold-bg)',
      color: '#8B6914',
      border: '0.5px solid var(--accent-gold-border)',
    },
  },
  'Хит': {
    emoji: '⭐',
    label: 'Хит',
    style: {
      background: 'var(--accent-gold-bg)',
      color: '#8B6914',
      border: '0.5px solid var(--accent-gold-border)',
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
  'Веган': {
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
  'Острое': {
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
  'Новое': {
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
      border: '0.5px solid var(--accent-gold-border)',
    },
  },
  'Шеф': {
    emoji: '👨‍🍳',
    label: 'Шеф',
    style: {
      background: 'var(--accent-gold-bg)',
      color: '#8B6914',
      border: '0.5px solid var(--accent-gold-border)',
    },
  },
};

interface TagBadgeProps {
  tag: string;
}

export default function TagBadge({ tag }: TagBadgeProps) {
  const config = TAG_MAP[tag];
  if (!config) return null;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '2px 7px',
        borderRadius: 'var(--radius-sm)',
        fontSize: 9,
        fontWeight: 500,
        lineHeight: 1.5,
        fontFamily: 'var(--font-ui)',
        whiteSpace: 'nowrap',
        ...config.style,
      }}
    >
      <span style={{ fontSize: 9, lineHeight: 1 }}>{config.emoji}</span>
      {config.label}
    </span>
  );
}
