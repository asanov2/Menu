import { CSSProperties, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { EmptyState, Skeleton, PLAN, ANALYTICS_DAYS, TOP_ITEMS_LIMIT, SectionHeading } from '@qrmenu/ui';
import { getOverview } from '../../api/analytics';
import { useAuth } from '../../hooks/useAuth';

const DAYS_OPTIONS = [
  { label: '7д',  value: 7 },
  { label: '30д', value: 30 },
  { label: '90д', value: ANALYTICS_DAYS[PLAN.PRO] },
];

const CARD_STYLE: CSSProperties = {
  background: 'var(--cream-bg)',
  border: '0.5px solid var(--cream-border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card)',
  padding: '20px 24px',
};

const getDayButtonStyle = (isActive: boolean, isLocked: boolean): CSSProperties => ({
  padding: '6px 14px',
  borderRadius: 'var(--radius-md)',
  border: '0.5px solid var(--cream-border)',
  background: isActive ? 'var(--ink-primary)' : 'var(--cream-surface)',
  color: isActive ? 'var(--cream-bg)' : isLocked ? 'var(--ink-tertiary)' : 'var(--ink-secondary)',
  fontSize: 12,
  fontFamily: 'var(--font-ui)',
  cursor: isLocked ? 'not-allowed' : 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
});

export default function DashboardPage() {
  const { restaurant } = useAuth();
  const [days, setDays] = useState(7);

  const { data, isLoading } = useQuery({
    queryKey: ['overview', days],
    queryFn: () => getOverview(days),
    staleTime: 1000 * 60 * 5,
  });

  const peakHour = data?.most_common_peak_hour != null
    ? `${String(data.most_common_peak_hour).padStart(2, '0')}:00`
    : '—';

  const chartData = data ? [
    { label: 'Просмотры меню', value: data.total_menu_views },
    { label: 'Просмотры блюд', value: data.total_item_views },
  ] : [];

  const statCards = [
    { label: 'Просмотров меню', value: data?.total_menu_views ?? 0 },
    { label: 'Просмотров блюд', value: data?.total_item_views ?? 0 },
    { label: 'Пиковый час',     value: peakHour },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ink-primary)', margin: 0 }}>
          Дашборд
        </h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {DAYS_OPTIONS.map((opt) => {
            const isLocked = opt.value === ANALYTICS_DAYS[PLAN.PRO] && restaurant?.plan !== PLAN.PRO;
            const isActive = days === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => !isLocked && setDays(opt.value)}
                style={getDayButtonStyle(isActive, isLocked)}
              >
                {isLocked && <span style={{ fontSize: 10 }}>🔒</span>}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={CARD_STYLE}>
              <Skeleton height="14px" width="60%" />
              <div style={{ marginTop: 10 }}><Skeleton height="28px" width="40%" /></div>
            </div>
          ))
        ) : (
          statCards.map((stat) => (
            <div key={stat.label} style={CARD_STYLE}>
              <div style={{ fontSize: 10, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                {stat.label}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink-primary)' }}>
                {stat.value}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chart */}
      <div style={{ ...CARD_STYLE, marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', marginBottom: 16 }}>Обзор просмотров</div>
        {isLoading ? (
          <Skeleton height="200px" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--cream-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'var(--font-ui)', fill: 'var(--ink-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'var(--font-ui)', fill: 'var(--ink-tertiary)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--cream-bg)', border: '0.5px solid var(--cream-border)', borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-ui)' }}
                cursor={{ fill: 'var(--cream-muted)' }}
              />
              <Bar dataKey="value" fill="var(--accent-gold)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top items */}
      <div style={CARD_STYLE}>
        <SectionHeading size="sm">Топ блюда</SectionHeading>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height="36px" />)}
          </div>
        ) : !data?.top_items?.length ? (
          <EmptyState icon="📊" title="Нет данных" description="Пока нет просмотров за этот период" />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'var(--font-ui)' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--cream-border)' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: 11, color: 'var(--ink-secondary)', fontWeight: 500, width: 32 }}>#</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: 11, color: 'var(--ink-secondary)', fontWeight: 500 }}>Название</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 11, color: 'var(--ink-secondary)', fontWeight: 500 }}>Просмотров</th>
              </tr>
            </thead>
            <tbody>
              {data.top_items.slice(0, TOP_ITEMS_LIMIT).map((item, idx) => (
                <tr
                  key={item.item_id}
                  style={{ borderBottom: '0.5px solid var(--cream-border)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--cream-muted)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                >
                  <td style={{ padding: '10px 8px', color: 'var(--ink-tertiary)' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--ink-primary)' }}>{item.item_id}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', color: 'var(--ink-secondary)' }}>{item.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
