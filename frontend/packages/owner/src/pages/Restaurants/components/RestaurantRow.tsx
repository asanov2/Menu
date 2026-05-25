import { memo } from 'react';
import { StatusBadge, formatDate, Icon } from '@qrmenu/ui';
import type { OwnerRestaurant } from '../../../api/owner';
import common from '../../../styles/common.module.css';
import styles from './RestaurantRow.module.css';

interface RestaurantRowProps {
  restaurant: OwnerRestaurant;
  onPlanChange: (id: string, plan: string, name: string) => void;
  onToggleActive: (restaurant: OwnerRestaurant) => void;
  onDelete: (restaurant: OwnerRestaurant) => void;
  isPending: boolean;
}

function RestaurantRow({ restaurant: r, onPlanChange, onToggleActive, onDelete, isPending }: RestaurantRowProps) {
  return (
    <tr className={styles.tr}>
      <td className={styles.tdName}>
        <span className={`${styles.nameContent} ${!r.is_active ? styles.nameContentInactive : ''}`}>
          <div className={styles.nameTitle}>{r.name}</div>
          <div className={styles.nameSlug}>{r.slug}</div>
        </span>
      </td>
      <td className={common.td}>
        <select
          value={r.plan}
          onChange={e => onPlanChange(r.id, e.target.value, r.name)}
          onClick={e => e.stopPropagation()}
          className={styles.planSelect}
        >
          <option value="starter">Старт</option>
          <option value="business">Бизнес</option>
          <option value="pro">Про</option>
        </select>
      </td>
      <td className={common.td}>
        <StatusBadge status={r.status as 'active' | 'trial' | 'expired'} />
      </td>
      <td className={common.td}>{formatDate(r.created_at)}</td>
      <td className={common.td}>{r.trial_ends_at ? formatDate(r.trial_ends_at) : '—'}</td>
      <td className={common.td}>
        <div className={styles.actions}>
          <button
            onClick={e => { e.stopPropagation(); onToggleActive(r); }}
            disabled={isPending}
            className={`${styles.toggleBtn} ${r.is_active ? styles.toggleBtnDeactivate : styles.toggleBtnActivate} ${isPending ? styles.toggleBtnPending : ''}`}
          >
            {r.is_active ? 'Деактивировать' : 'Активировать'}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(r); }}
            disabled={isPending}
            className={styles.deleteBtn}
            title="Удалить ресторан"
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default memo(RestaurantRow);
