import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Skeleton, PLAN, ANALYTICS_DAYS, SectionHeading } from '@qrmenu/ui';
import { getOverview, getDailyStats, getPeakHours, getTopByCategory } from '../../api/analytics';
import TopItemsByCategory from './TopItemsByCategory';
import { useAuth } from '../../hooks/useAuth';
import styles from './DashboardPage.module.css';
import common from '../../styles/common.module.css';

const DAYS_OPTIONS = [
  { label: '7д',  value: 7 },
  { label: '30д', value: 30 },
  { label: '90д', value: ANALYTICS_DAYS[PLAN.PRO] },
];

const TOOLTIP_STYLE = {
  background: 'var(--cream-bg)',
  border: '0.5px solid var(--cream-border)',
  borderRadius: 8,
  fontSize: 12,
  fontFamily: 'var(--font-ui)',
};

const TICK = { fontSize: 10, fontFamily: 'var(--font-ui)', fill: 'var(--ink-tertiary)' };

function getDateRange(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  return {
    endDate: end.toISOString().split('T')[0],
    startDate: start.toISOString().split('T')[0],
  };
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}.${d.getMonth() + 1}`;
}

export default function DashboardPage() {
  const { restaurant } = useAuth();
  const [days, setDays] = useState(7);

  const { startDate, endDate } = getDateRange(days);

  const { data, isLoading } = useQuery({
    queryKey: ['overview', days],
    queryFn: () => getOverview(days),
    staleTime: 1000 * 60 * 5,
  });

  const { data: dailyData, isLoading: isDailyLoading } = useQuery({
    queryKey: ['analytics-daily', days],
    queryFn: () => getDailyStats(startDate, endDate),
    retry: false,
  });

  const { data: peakData, isLoading: isPeakLoading } = useQuery({
    queryKey: ['analytics-peak', days],
    queryFn: () => getPeakHours(days),
    retry: false,
  });

  const { data: categoryData, isLoading: isCategoryLoading } = useQuery({
    queryKey: ['analytics-top-by-category', days],
    queryFn: () => getTopByCategory(days),
    retry: false,
  });

  const hasData = (data?.total_menu_views ?? 0) > 0 || (data?.total_item_views ?? 0) > 0;
  const hasDailyData = (dailyData ?? []).some(d => d.menu_views > 0 || d.item_views > 0);
  const hasPeakData = (peakData ?? []).some(h => h.views > 0);

  const peakHour = (peakData ?? []).reduce<{ hour: number; views: number } | null>(
    (max, h) => (max === null || h.views > max.views) ? h : max,
    null,
  );

  const peakHourStr = data?.most_common_peak_hour != null
    ? `${String(data.most_common_peak_hour).padStart(2, '0')}:00`
    : '—';

  const dailyChartData = (dailyData ?? []).map(d => ({
    date: fmtDate(d.date),
    menu: d.menu_views,
    items: d.item_views,
  }));

  const peakChartData = (peakData ?? []).map(h => ({
    hour: `${String(h.hour).padStart(2, '0')}:00`,
    views: h.views,
    isPeak: peakHour !== null && h.hour === peakHour.hour && peakHour.views > 0,
  }));

  const statCards = [
    { label: 'Просмотров меню', value: data?.total_menu_views ?? 0 },
    { label: 'Просмотров блюд', value: data?.total_item_views ?? 0 },
    { label: 'Пиковый час',     value: peakHourStr },
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

      {/* KPI cards */}
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

      {/* Daily views chart */}
      <div className={`${common.card} ${styles.cardChart}`}>
        <div className={styles.chartLabel}>Просмотры по дням</div>
        {isDailyLoading ? (
          <Skeleton height="200px" />
        ) : !hasDailyData ? (
          <div className={styles.emptyAnalytics}>
            <span>📊</span>
            <p>Аналитика появится после первых посещений меню</p>
            <small>Данные обновляются ежедневно</small>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--cream-border)" />
              <XAxis dataKey="date" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tick={TICK} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--cream-muted)' }} />
              <Bar dataKey="menu" name="Просмотры меню" fill="var(--accent-gold)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="items" name="Просмотры блюд" fill="var(--ink-tertiary)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Peak hours chart */}
      <div className={`${common.card} ${styles.cardChart}`}>
        {peakHour && peakHour.views > 0 && (
          <div className={styles.peakBadge}>
            🕐 Пиковый час: {String(peakHour.hour).padStart(2, '0')}:00 — {peakHour.views} просмотров
          </div>
        )}
        <div className={styles.chartLabel}>Пиковые часы</div>
        {isPeakLoading ? (
          <Skeleton height="160px" />
        ) : !hasPeakData ? (
          <div className={styles.emptyAnalytics}>
            <span>🕐</span>
            <p>Нет данных о пиковых часах за этот период</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={peakChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--cream-border)" />
              <XAxis dataKey="hour" tick={{ ...TICK, fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={TICK} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--cream-muted)' }} />
              <Bar dataKey="views" name="Просмотров" radius={[3, 3, 0, 0]}>
                {peakChartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.isPeak ? 'var(--accent-gold)' : 'var(--cream-border)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top items by category */}
      <div className={common.card}>
        <SectionHeading size="sm">Топ блюда по категориям</SectionHeading>
        <TopItemsByCategory
          categories={categoryData ?? []}
          isLoading={isCategoryLoading}
        />
      </div>
    </div>
  );
}
