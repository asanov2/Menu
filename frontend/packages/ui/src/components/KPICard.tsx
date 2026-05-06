import type { ReactNode } from 'react';
import { CARD_STYLE } from '../styles/shared';

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
    <div style={{ ...CARD_STYLE, position: 'relative', overflow: 'hidden' }}>
      {icon && (
        <span style={{
          position: 'absolute',
          top: 12,
          right: 12,
          fontSize: 32,
          opacity: 0.2,
          userSelect: 'none',
        }}>
          {icon}
        </span>
      )}
      <div style={{
        fontSize: 10,
        fontFamily: 'var(--font-ui)',
        color: 'var(--ink-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 28,
        color: 'var(--ink-primary)',
        lineHeight: 1,
        marginBottom: subtitle ? 6 : 0,
      }}>
        {loading ? '—' : (value ?? '—')}
      </div>
      {subtitle && (
        <div style={{
          fontSize: 10,
          fontFamily: 'var(--font-ui)',
          color: SUBTITLE_COLORS[subtitleColor],
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
