import { memo } from 'react';
import { StatusBadge, formatDate } from '@qrmenu/ui';
import type { OwnerRestaurant } from '../../../api/owner';

interface RestaurantRowProps {
  restaurant: OwnerRestaurant;
  onPlanChange: (id: string, plan: string) => void;
  onToggleActive: (restaurant: OwnerRestaurant) => void;
  isPending: boolean;
}

const TD: React.CSSProperties = { padding: '0 12px', fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-secondary)' };

function RestaurantRow({ restaurant: r, onPlanChange, onToggleActive, isPending }: RestaurantRowProps) {
  return (
    <tr style={{ height: 44, borderBottom: '1px solid var(--cream-border)' }}>
      <td style={{ padding: '8px 12px' }}>
        <span style={{ opacity: r.is_active ? 1 : 0.6 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500, color: 'var(--ink-primary)' }}>{r.name}</div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--ink-secondary)' }}>{r.slug}</div>
        </span>
      </td>
      <td style={TD}>
        <select
          defaultValue={r.plan}
          onChange={e => onPlanChange(r.id, e.target.value)}
          onClick={e => e.stopPropagation()}
          style={{ fontFamily: 'var(--font-ui)', fontSize: 11, border: '1px solid var(--cream-border)', borderRadius: 'var(--radius-sm)', background: 'var(--cream-bg)', color: 'var(--ink-primary)', padding: '2px 6px', cursor: 'pointer' }}
        >
          <option value="starter">Старт</option>
          <option value="business">Бизнес</option>
          <option value="pro">Про</option>
        </select>
      </td>
      <td style={TD}>
        <StatusBadge status={r.status as 'active' | 'trial' | 'expired'} />
      </td>
      <td style={TD}>{formatDate(r.created_at)}</td>
      <td style={TD}>{r.trial_ends_at ? formatDate(r.trial_ends_at) : '—'}</td>
      <td style={TD}>
        <button
          onClick={e => { e.stopPropagation(); onToggleActive(r); }}
          disabled={isPending}
          style={{
            padding: '4px 10px',
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            border: `1px solid ${r.is_active ? 'var(--error-border)' : 'var(--tag-green-border)'}`,
            background: r.is_active ? 'var(--tag-red-bg)' : 'var(--tag-green-bg)',
            color: r.is_active ? 'var(--tag-red-text)' : 'var(--tag-green-text)',
            borderRadius: 'var(--radius-sm)',
            cursor: isPending ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {r.is_active ? 'Деактивировать' : 'Активировать'}
        </button>
      </td>
    </tr>
  );
}

export default memo(RestaurantRow);
