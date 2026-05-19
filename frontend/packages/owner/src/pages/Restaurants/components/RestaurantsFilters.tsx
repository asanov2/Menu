import { PLAN, PLAN_STATUS, SectionHeading } from '@qrmenu/ui';
import styles from './RestaurantsFilters.module.css';

const FILTERS = [
  { label: 'Все',    value: 'all' },
  { label: 'Старт',  value: PLAN.STARTER },
  { label: 'Бизнес', value: PLAN.BUSINESS },
  { label: 'Про',    value: PLAN.PRO },
  { label: 'Триал',  value: PLAN_STATUS.TRIAL },
  { label: 'Истёк',  value: PLAN_STATUS.EXPIRED },
];

interface RestaurantsFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  totalCount: number;
}

export default function RestaurantsFilters({
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  totalCount,
}: RestaurantsFiltersProps) {
  return (
    <div className={styles.container}>
      <SectionHeading
        size="lg"
        action={
          <span className={styles.countBadge}>{totalCount}</span>
        }
        style={{ marginBottom: 0 }}
      >
        Рестораны
      </SectionHeading>

      <div className={styles.searchWrapper}>
        <i className="ti ti-search" style={{ fontSize: 16, lineHeight: 1 }} />
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Поиск по названию или slug..."
          className={styles.searchInput}
        />
      </div>

      <div className={styles.filtersRow}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={`${styles.filterBtn} ${activeFilter === f.value ? styles.filterBtnActive : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
