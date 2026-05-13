import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { EmptyState, Skeleton, PLAN, ANALYTICS_DAYS, TOP_ITEMS_LIMIT, SectionHeading } from '@qrmenu/ui';
import { getOverview } from '../../api/analytics';
import { useAuth } from '../../hooks/useAuth';
import styles from './DashboardPage.module.css';
import common from '../../styles/common.module.css';

const DAYS_OPTIONS = [
  { label: '7д',  value: 7 },
  { label: '30д', value: 30 },
  { label: '90д', value: ANALYTICS_DAYS[PLAN.PRO] },
];

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
      <div className={common.pageHeader}>
        <h1 className={common.pageTitle}>Дашборд</h1>
        <div className={styles.dayBtns}>
          {DAYS_OPTIONS.map((opt) => {
            const isLocked = opt.value === ANALYTICS_DAYS[PLAN.PRO] && restaurant?.plan !== PLAN.PRO;
            const isActive = days === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => !isLocked && setDays(opt.value)}
                className={`${styles.dayBtn} ${isActive ? styles.dayBtnActive : ''} ${isLocked ? styles.dayBtnLocked : ''}`}
              >
                {isLocked && <span className={styles.lockIcon}>🔒</span>}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={common.card}>
              <Skeleton height="14px" width="60%" />
              <div className={styles.skeletonSpacing}><Skeleton height="28px" width="40%" /></div>
            </div>
          ))
        ) : (
          statCards.map((stat) => (
            <div key={stat.label} className={common.card}>
              <div className={styles.statLabel}>{stat.label}</div>
              <div className={styles.statValue}>{stat.value}</div>
            </div>
          ))
        )}
      </div>

      {/* Chart */}
      <div className={`${common.card} ${styles.cardChart}`}>
        <div className={styles.chartLabel}>Обзор просмотров</div>
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
      <div className={common.card}>
        <SectionHeading size="sm">Топ блюда</SectionHeading>
        {isLoading ? (
          <div className={styles.skeletonList}>
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height="36px" />)}
          </div>
        ) : !data?.top_items?.length ? (
          <EmptyState icon="📊" title="Нет данных" description="Пока нет просмотров за этот период" />
        ) : (
          <table className={common.table}>
            <thead>
              <tr className={common.theadRow}>
                <th className={`${common.th} ${styles.thNum}`}>#</th>
                <th className={common.th}>Название</th>
                <th className={`${common.th} ${common.thRight}`}>Просмотров</th>
              </tr>
            </thead>
            <tbody>
              {data.top_items.slice(0, TOP_ITEMS_LIMIT).map((item, idx) => (
                <tr key={item.item_id} className={common.tr}>
                  <td className={common.td}>{idx + 1}</td>
                  <td className={common.tdPrimary}>{item.item_id}</td>
                  <td className={common.tdRight}>{item.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
