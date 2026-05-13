import type { ReactNode } from 'react';
import styles from './KPICard.module.css';

type KPISubtitleColor = 'green' | 'red' | 'gold' | 'default';

interface KPICardProps {
  label: string;
  value: string | number | undefined;
  subtitle?: string;
  subtitleColor?: KPISubtitleColor;
  icon?: string;
  loading?: boolean;
}

const SUBTITLE_COLORS: Record<KPISubtitleColor, string> = {
  green:   'var(--tag-green-text)',
  red:     'var(--error-text)',
  gold:    'var(--accent-gold)',
  default: 'var(--ink-secondary)',
};

export function KPICard({ label, value, subtitle, subtitleColor = 'default', icon, loading }: KPICardProps) {
  return (
    <div className={styles.card}>
      {icon && (
        <span className={styles.iconBg}>{icon}</span>
      )}
      <div className={styles.label}>{label}</div>
      <div
        className={styles.value}
        style={{ marginBottom: subtitle ? 6 : 0 }}
      >
        {loading ? '—' : (value ?? '—')}
      </div>
      {subtitle && (
        <div
          className={styles.subtitle}
          style={{ color: SUBTITLE_COLORS[subtitleColor] }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
