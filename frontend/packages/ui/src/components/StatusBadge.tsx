import type { CSSProperties } from 'react';
import { PLAN, PLAN_STATUS, type Plan, type PlanStatus } from '../constants/plans';

type BadgeVariant = Plan | PlanStatus | 'online' | 'offline' | 'failed' | 'pending';

const BADGE_STYLES: Record<string, CSSProperties> = {
  [PLAN.STARTER]:            { background: 'var(--cream-muted)',       color: 'var(--ink-secondary)',  border: '0.5px solid var(--cream-border)' },
  [PLAN.BUSINESS]:           { background: 'var(--tag-green-bg)',      color: 'var(--tag-green-text)', border: '0.5px solid var(--tag-green-border)' },
  [PLAN.PRO]:                { background: 'var(--accent-gold-bg)',    color: 'var(--accent-gold)',    border: '0.5px solid var(--accent-gold-border)' },
  [PLAN_STATUS.ACTIVE]:      { background: 'var(--tag-green-bg)',      color: 'var(--tag-green-text)', border: '0.5px solid var(--tag-green-border)' },
  [PLAN_STATUS.TRIAL]:       { background: 'var(--accent-gold-bg)',    color: 'var(--accent-gold)',    border: '0.5px solid var(--accent-gold-border)' },
  [PLAN_STATUS.EXPIRED]:     { background: 'var(--tag-red-bg)',        color: 'var(--tag-red-text)',   border: '0.5px solid var(--tag-red-border)' },
  [PLAN_STATUS.CANCELLED]:   { background: 'var(--cream-muted)',       color: 'var(--ink-tertiary)',   border: '0.5px solid var(--cream-border)' },
  online:  { background: 'var(--tag-green-bg)',  color: 'var(--tag-green-text)', border: '0.5px solid var(--tag-green-border)' },
  offline: { background: 'var(--tag-red-bg)',    color: 'var(--tag-red-text)',   border: '0.5px solid var(--tag-red-border)' },
  failed:  { background: 'var(--tag-red-bg)',    color: 'var(--tag-red-text)',   border: '0.5px solid var(--tag-red-border)' },
  pending: { background: 'var(--tag-blue-bg)',   color: 'var(--tag-blue-text)',  border: '0.5px solid var(--tag-blue-border)' },
};

const BADGE_LABELS: Record<string, string> = {
  [PLAN.STARTER]:          'Старт',
  [PLAN.BUSINESS]:         'Бизнес',
  [PLAN.PRO]:              'Про',
  [PLAN_STATUS.ACTIVE]:    'Активен',
  [PLAN_STATUS.TRIAL]:     'Пробный',
  [PLAN_STATUS.EXPIRED]:   'Истёк',
  [PLAN_STATUS.CANCELLED]: 'Отменён',
  online:  'Online',
  offline: 'Offline',
  failed:  'Ошибка',
  pending: 'Ожидание',
};

interface StatusBadgeProps {
  status: BadgeVariant;
  label?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, label, size = 'sm' }: StatusBadgeProps) {
  const style = BADGE_STYLES[status] ?? BADGE_STYLES[PLAN_STATUS.EXPIRED];
  const text = label ?? BADGE_LABELS[status] ?? status;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: size === 'md' ? '4px 12px' : '2px 8px',
      borderRadius: 'var(--radius-full)',
      fontSize: size === 'md' ? 12 : 10,
      fontFamily: 'var(--font-ui)',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {text}
    </span>
  );
}
