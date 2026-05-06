import { PLAN, PLAN_STATUS, SectionHeading } from '@qrmenu/ui';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionHeading
        size="lg"
        action={
          <span style={{ padding: '3px 10px', background: 'var(--cream-muted)', borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-secondary)' }}>
            {totalCount}
          </span>
        }
        style={{ marginBottom: 0 }}
      >
        Рестораны
      </SectionHeading>

      <div style={{ position: 'relative', maxWidth: 340 }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-secondary)', fontSize: 13, pointerEvents: 'none' }}>
          🔍
        </span>
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Поиск по названию или slug..."
          style={{
            width: '100%',
            paddingLeft: 32,
            paddingRight: 12,
            paddingTop: 8,
            paddingBottom: 8,
            fontFamily: 'var(--font-ui)',
            fontSize: 13,
            border: '1px solid var(--cream-border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--cream-surface)',
            color: 'var(--ink-primary)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            style={{
              padding: '4px 12px',
              fontFamily: 'var(--font-ui)',
              fontSize: 12,
              border: `1px solid ${activeFilter === f.value ? 'var(--ink-primary)' : 'var(--cream-border)'}`,
              background: activeFilter === f.value ? 'var(--ink-primary)' : 'transparent',
              color: activeFilter === f.value ? 'var(--cream-surface)' : 'var(--ink-secondary)',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
