// === FILE: frontend/packages/admin/src/pages/Dashboard/DashboardPage.tsx ===
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { EmptyState, Skeleton, formatDate } from '@qrmenu/ui';
import { getOverview } from '../../api/analytics';
import { useAuth } from '../../hooks/useAuth';

const DAYS_OPTIONS = [
  { label: '7д', value: 7 },
  { label: '30д', value: 30 },
  { label: '90д', value: 90 },
];

function cardStyle(): React.CSSProperties {
  return {
    background: '#FDFAF5',
    border: '0.5px solid var(--cream-border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-card)',
    padding: '20px 24px',
  };
}

export default function DashboardPage() {
  const { restaurant } = useAuth();
  const [days, setDays] = useState(7);

  const { data, isLoading } = useQuery({
    queryKey: ['overview', days],
    queryFn: () => getOverview(days),
    staleTime: 1000 * 60 * 5,
  });

  const chartData = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return {
      date: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      views: Math.floor(Math.random() * 80 + 10),
    };
  });

  const peakHour = data?.most_common_peak_hour != null
    ? `${String(data.most_common_peak_hour).padStart(2, '0')}:00`
    : '—';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ink-primary)', margin: 0 }}>
          Дашборд
        </h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {DAYS_OPTIONS.map((opt) => {
            const isLocked = opt.value === 90 && restaurant?.plan !== 'pro';
            const isActive = days === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => !isLocked && setDays(opt.value)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '0.5px solid var(--cream-border)',
                  background: isActive ? 'var(--ink-primary)' : 'white',
                  color: isActive ? 'var(--cream-bg)' : isLocked ? 'var(--ink-tertiary)' : 'var(--ink-secondary)',
                  fontSize: 12,
                  fontFamily: 'var(--font-ui)',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
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
            <div key={i} style={cardStyle()}>
              <Skeleton height="14px" width="60%" />
              <div style={{ marginTop: 10 }}><Skeleton height="28px" width="40%" /></div>
            </div>
          ))
        ) : (
          <>
            <div style={cardStyle()}>
              <div style={{ fontSize: 10, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Просмотров меню</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink-primary)' }}>{data?.total_menu_views ?? 0}</div>
            </div>
            <div style={cardStyle()}>
              <div style={{ fontSize: 10, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Просмотров блюд</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink-primary)' }}>{data?.total_item_views ?? 0}</div>
            </div>
            <div style={cardStyle()}>
              <div style={{ fontSize: 10, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Пиковый час</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink-primary)' }}>{peakHour}</div>
            </div>
          </>
        )}
      </div>

      {/* Chart */}
      <div style={{ ...cardStyle(), marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', marginBottom: 16 }}>Просмотры меню</div>
        {isLoading ? (
          <Skeleton height="200px" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--cream-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'var(--font-ui)', fill: 'var(--ink-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'var(--font-ui)', fill: 'var(--ink-tertiary)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#FDFAF5', border: '0.5px solid var(--cream-border)', borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-ui)' }}
                cursor={{ fill: 'var(--cream-muted)' }}
              />
              <Bar dataKey="views" fill="var(--accent-gold)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top items */}
      <div style={cardStyle()}>
        <div style={{ fontSize: 15, fontFamily: 'var(--font-display)', color: 'var(--ink-primary)', marginBottom: 16 }}>Топ блюда</div>
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
              {data.top_items.slice(0, 10).map((item) => (
                <tr
                  key={item.item_id}
                  style={{ borderBottom: '0.5px solid var(--cream-border)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--cream-muted)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                >
                  <td style={{ padding: '10px 8px', color: 'var(--ink-tertiary)' }}>{item.rank}</td>
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
