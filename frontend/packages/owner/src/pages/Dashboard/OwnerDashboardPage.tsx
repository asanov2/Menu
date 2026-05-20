import { CSSProperties, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatPrice, Skeleton, KPICard, SectionHeading } from '@qrmenu/ui'
import { getPlatformStats, getRevenue, getPayments } from '../../api/owner'
import DataTable from '../../components/DataTable'
import common from '../../styles/common.module.css'
import styles from './OwnerDashboardPage.module.css'

const MONTH_SHORT = [
  'Янв','Фев','Мар','Апр','Май','Июн',
  'Июл','Авг','Сен','Окт','Ноя','Дек',
]

function monthShort(m: string) {
  const idx = parseInt(m.split('-')[1], 10) - 1
  return MONTH_SHORT[idx] ?? m
}

function formatKZDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('ru-RU', {
    timeZone: 'Asia/Almaty',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  success: {
    bg: 'var(--tag-green-bg)',
    color: 'var(--tag-green-text)',
    border: 'var(--tag-green-border)',
    label: 'Успешен',
  },
  refunded: {
    bg: 'var(--cream-muted)',
    color: 'var(--ink-secondary)',
    border: 'var(--cream-border)',
    label: 'Возврат',
  },
  pending: {
    bg: 'var(--accent-gold-bg)',
    color: 'var(--accent-gold)',
    border: 'var(--accent-gold-border)',
    label: 'Ожидание',
  },
  failed: {
    bg: 'var(--tag-red-bg)',
    color: 'var(--tag-red-text)',
    border: 'var(--tag-red-border)',
    label: 'Ошибка',
  },
}

const PROVIDER_LABEL: Record<string, string> = {
  kaspi: 'Kaspi Pay',
  stripe: 'Stripe',
  manual: 'Вручную',
  cloudpayments: 'Cloud Pay',
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending
  return (
    <span
      className={common.statusBadge}
      style={{ background: s.bg, color: s.color, borderColor: s.border } as CSSProperties}
    >
      {s.label}
    </span>
  )
}

export default function OwnerDashboardPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const currentMonthStr = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: getPlatformStats,
    refetchInterval: 60_000,
  })
  const { data: revenue } = useQuery({
    queryKey: ['revenue', year],
    queryFn: () => getRevenue(year),
    refetchInterval: 60_000,
  })
  const { data: payments } = useQuery({
    queryKey: ['payments-dash'],
    queryFn: () => getPayments(1, 5),
    refetchInterval: 60_000,
  })

  const yearTotal = (revenue ?? []).reduce((s, r) => s + r.amount, 0)
  const paying = stats?.paying_count ?? 0
  const total = stats?.total_restaurants ?? 0
  const arpu = paying > 0 ? Math.round((stats?.mrr ?? 0) / paying) : 0
  const conversionPct = total > 0 ? Math.round((paying / total) * 100) : 0

  const revenueData = (revenue ?? []).map(r => ({
    name: monthShort(r.month),
    value: r.amount,
    isCurrentMonth: r.month === currentMonthStr,
  }))

  const starterCount = stats?.starter_count ?? 0
  const businessCount = stats?.business_count ?? 0
  const proCount = stats?.pro_count ?? 0
  const trialCount = stats?.trial_count ?? 0
  const planDist = [
    { label: 'Старт',  count: starterCount,  pct: total > 0 ? Math.round((starterCount  / total) * 100) : 0, color: 'var(--ink-tertiary)' },
    { label: 'Бизнес', count: businessCount, pct: total > 0 ? Math.round((businessCount / total) * 100) : 0, color: 'var(--tag-green-text)' },
    { label: 'Про',    count: proCount,      pct: total > 0 ? Math.round((proCount      / total) * 100) : 0, color: 'var(--accent-gold)' },
    { label: 'Триал',  count: trialCount,    pct: total > 0 ? Math.round((trialCount    / total) * 100) : 0, color: 'var(--ink-secondary)' },
  ]

  const paymentRows = (payments?.items ?? []).map(p => {
    const s = STATUS_STYLE[p.status] ?? STATUS_STYLE.pending
    return {
      restaurant: p.restaurant_name,
      amount: formatPrice(p.amount),
      status: (
        <span
          className={common.statusBadge}
          style={{ background: s.bg, color: s.color, borderColor: s.border } as CSSProperties}
        >
          {s.label}
        </span>
      ),
      provider: PROVIDER_LABEL[p.provider] ?? p.provider,
      date: formatKZDate(p.created_at),
    }
  })

  return (
    <div className={common.pageStack}>
      <SectionHeading size="lg" className={common.mb4}>Дашборд</SectionHeading>

      {isLoadingStats ? (
        <>
          <div className={common.kpiGrid4}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height="80px" borderRadius="var(--radius-md)" />
            ))}
          </div>
          <div className={common.kpiGrid3}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height="80px" borderRadius="var(--radius-md)" />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className={common.kpiGrid4}>
            <KPICard label="Ресторанов" value={stats?.total_restaurants ?? '—'} icon="building-store" />
            <KPICard label="MRR" value={stats ? formatPrice(stats.mrr) : '—'} subtitleColor="gold" icon="cash" />
            <KPICard label="Платящих" value={paying || '—'} subtitleColor="green" icon="circle-check" />
            <KPICard label="Триал" value={trialCount || '—'} subtitleColor="gold" icon="hourglass" />
          </div>
          <div className={common.kpiGrid3}>
            <KPICard label={`Выручка ${year}`} value={formatPrice(yearTotal)} icon="diamond" />
            <KPICard label="ARPU" value={arpu ? formatPrice(arpu) : '—'} icon="chart-bar" />
            <KPICard label="Конверсия" value={conversionPct ? `${conversionPct}%` : '—'} subtitleColor="green" icon="trending-up" />
          </div>
        </>
      )}

      <div className={styles.chartsRow}>
        <div className={common.card}>
          <div className={styles.chartCardHeader}>
            <div className={common.cardTitle}>Выручка по месяцам</div>
            <div className={styles.yearPicker}>
              {[currentYear - 1, currentYear].map(y => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`${styles.yearBtn} ${year === y ? styles.yearBtnActive : ''}`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontFamily: 'var(--font-ui)', fontSize: 11, fill: 'var(--ink-secondary)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontFamily: 'var(--font-ui)', fontSize: 10, fill: 'var(--ink-secondary)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${Math.round((v as number) / 1000)}k`}
                />
                <Tooltip
                  formatter={(v: number) => [formatPrice(v), 'Выручка']}
                  contentStyle={{ fontFamily: 'var(--font-ui)', fontSize: 12, borderRadius: 8, border: '1px solid var(--cream-border)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {revenueData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.value > 0
                        ? (entry.isCurrentMonth ? 'var(--accent-gold)' : '#c8963e')
                        : 'var(--cream-muted)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={common.card}>
          <div className={common.cardTitle}>Тарифы</div>
          <div className={styles.planList}>
            {planDist.map(p => (
              <div key={p.label}>
                <div className={styles.planRowHeader}>
                  <span className={styles.planLabel}>{p.label}</span>
                  <span className={styles.planCount}>{p.pct}% · {p.count}</span>
                </div>
                <div className={styles.planBarTrack}>
                  <div
                    className={styles.planBarFill}
                    style={{ width: `${p.pct}%`, background: p.color } as CSSProperties}
                  />
                </div>
              </div>
            ))}
          </div>
          {trialCount > 0 && (
            <p className={styles.trialNote}>* Триал не входит в MRR</p>
          )}
        </div>
      </div>

      <div className={common.card}>
        <div className={styles.paymentsCardHeader}>
          <div className={common.cardTitle}>Последние платежи</div>
          <Link to="/revenue" className={styles.viewAllLink}>Показать все →</Link>
        </div>
        <DataTable
          columns={[
            { key: 'restaurant', label: 'Ресторан' },
            { key: 'amount', label: 'Сумма', width: '100px' },
            { key: 'status', label: 'Статус', width: '90px' },
            { key: 'provider', label: 'Провайдер', width: '100px' },
            { key: 'date', label: 'Дата', width: '100px' },
          ]}
          rows={paymentRows}
          loading={!payments}
          emptyMessage="Нет платежей"
        />
      </div>
    </div>
  )
}
