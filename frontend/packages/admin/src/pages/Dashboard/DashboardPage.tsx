import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { Skeleton, PLAN, ANALYTICS_DAYS, SectionHeading, Icon } from '@qrmenu/ui';
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

const MONTHS_SHORT = [
  'янв','фев','мар','апр','май','июн',
  'июл','авг','сен','окт','ноя','дек',
];

const TOOLTIP_STYLE = {
  background: 'var(--cream-bg)',
  border: '0.5px solid var(--cream-border)',
  borderRadius: 8,
  fontSize: 12,
  fontFamily: 'var(--font-ui)',
};

const TICK = { fontSize: 10, fontFamily: 'var(--font-ui)', fill: 'var(--ink-tertiary)' };

const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

function formatChartDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(d, 10)} ${MONTHS_SHORT[parseInt(m, 10) - 1]}`;
}

function formatHour(hour: number | string): string {
  return `${hour}:00`;
}

function toKZDateString(date: Date): string {
  // Format date in Kazakhstan timezone (UTC+5) as YYYY-MM-DD
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Almaty' });
}

function getDateRange(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  return {
    endDate: toKZDateString(end),
    startDate: toKZDateString(start),
  };
}

export default function DashboardPage() {
  const { restaurant } = useAuth();
  const [days, setDays] = useState(7);

  const { startDate, endDate } = getDateRange(days);

  const { data, isLoading } = useQuery({
    queryKey: ['overview', days],
    queryFn: () => getOverview(days),
    staleTime: 0,
    refetchInterval: 30_000,
  });

  const { data: dailyData, isLoading: isDailyLoading } = useQuery({
    queryKey: ['analytics-daily', days],
    queryFn: () => getDailyStats(startDate, endDate),
    staleTime: 0,
    refetchInterval: 30_000,
    retry: false,
  });

  const { data: peakData, isLoading: isPeakLoading } = useQuery({
    queryKey: ['analytics-peak', days],
    queryFn: () => getPeakHours(days),
    staleTime: 0,
    refetchInterval: 30_000,
    retry: false,
  });

  const { data: categoryData, isLoading: isCategoryLoading } = useQuery({
    queryKey: ['analytics-top-by-category', days],
    queryFn: () => getTopByCategory(days),
    staleTime: 0,
    refetchInterval: 60_000,
    retry: false,
  });

  const hasDailyData = (dailyData ?? []).some(d => d.menu_views > 0 || d.item_views > 0);
  const hasPeakData = (peakData ?? []).some(h => h.views > 0);

  const peakHour = (peakData ?? []).reduce<{ hour: number; views: number } | null>(
    (max, h) => (max === null || h.views > max.views) ? h : max,
    null,
  );

  const avgViews = hasPeakData
    ? (peakData ?? []).reduce((s, h) => s + h.views, 0) / 24
    : 0;

  const peakHourStr = peakHour && peakHour.views > 0
    ? `${String(peakHour.hour).padStart(2, '0')}:00 – ${String(peakHour.hour + 1).padStart(2, '0')}:00`
    : '—';

  const dailyChartData = (dailyData ?? []).map(d => ({
    date: d.date,
    menu: d.menu_views,
    items: d.item_views,
  }));

  const peakChartData = (peakData ?? []).map(h => ({
    hour: h.hour,
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
            const isLocked = (() => {
              const plan = restaurant?.plan ?? PLAN.STARTER;
              const allowed = ANALYTICS_DAYS[plan as keyof typeof ANALYTICS_DAYS] ?? 7;
              return opt.value > allowed;
            })();
            const isActive = days === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => !isLocked && setDays(opt.value)}
                className={`${styles.dayBtn} ${isActive ? styles.dayBtnActive : ''} ${isLocked ? styles.dayBtnLocked : ''}`}
                title={isLocked ? 'Недоступно на вашем тарифе' : undefined}
              >
                {isLocked && <Icon name="lock" size={14} className={styles.lockIcon} />}
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
            <Icon name="chart-bar" size={20} />
            <p>Нет данных за выбранный период</p>
            <small>Данные обновляются ежедневно в 01:00</small>
          </div>
        ) : (
          <div className={styles.chartWrapLg}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--cream-border)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
                  tick={TICK}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: 'var(--cream-muted)' }}
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'menu' ? 'Просмотры меню' : 'Просмотры блюд',
                  ]}
                  labelFormatter={(label: string) => formatChartDate(label)}
                />
                <Bar dataKey="menu" name="menu" fill="var(--accent-gold)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="items" name="items" fill="var(--ink-tertiary)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Peak hours chart */}
      <div className={`${common.card} ${styles.cardChart}`}>
        <div className={styles.chartHeader}>
          <div className={styles.chartLabel}>Активность по часам</div>
          {peakHour && peakHour.views > 0 && (
            <div className={styles.peakBadge}>
              <Icon name="clock" size={14} /> Самый активный час: {String(peakHour.hour).padStart(2, '0')}:00–{String(peakHour.hour + 1).padStart(2, '0')}:00 · {peakHour.views} просмотров
            </div>
          )}
        </div>
        {isPeakLoading ? (
          <Skeleton height="160px" />
        ) : !hasPeakData ? (
          <div className={styles.emptyAnalytics}>
            <Icon name="clock" size={14} />
            <p>Нет данных о пиковых часах</p>
          </div>
        ) : (
          <div className={styles.chartWrapSm}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakChartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--cream-border)" />
                <XAxis
                  dataKey="hour"
                  tickFormatter={formatHour}
                  interval={isMobile ? 5 : 2}
                  tick={TICK}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: 'var(--cream-muted)' }}
                  formatter={(value: number) => [value, 'просмотров']}
                  labelFormatter={(hour: number) => `${String(hour).padStart(2, '0')}:00 – ${String(hour + 1).padStart(2, '0')}:00`}
                />
                {avgViews > 0 && (
                  <ReferenceLine
                    y={avgViews}
                    stroke="var(--ink-tertiary)"
                    strokeDasharray="3 3"
                    label={isMobile ? undefined : {
                      value: 'среднее',
                      position: 'insideTopRight',
                      fontSize: 11,
                      fontFamily: 'var(--font-ui)',
                      fill: 'var(--ink-tertiary)',
                    }}
                  />
                )}
                <Bar dataKey="views" radius={[3, 3, 0, 0]}>
                  {peakChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.isPeak ? 'var(--accent-gold)' : 'var(--cream-border)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top items by category */}
      <div className={common.card}>
        <SectionHeading size="sm">Топ блюда · за {days} дней</SectionHeading>
        <TopItemsByCategory
          categories={categoryData ?? []}
          isLoading={isCategoryLoading}
        />
      </div>
    </div>
  );
}
