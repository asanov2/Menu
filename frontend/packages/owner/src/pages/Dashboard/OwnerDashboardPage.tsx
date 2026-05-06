// === FILE: frontend/packages/owner/src/pages/Dashboard/OwnerDashboardPage.tsx ===
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatPrice, formatDate, Skeleton, KPICard, SectionHeading } from '@qrmenu/ui'
import { getPlatformStats, getRevenue, getPayments } from '../../api/owner'
import DataTable from '../../components/DataTable'

const MONTH_SHORT = [
  'Янв','Фев','Мар','Апр','Май','Июн',
  'Июл','Авг','Сен','Окт','Ноя','Дек',
]

function monthShort(m: string) {
  const idx = parseInt(m.split('-')[1], 10) - 1
  return MONTH_SHORT[idx] ?? m
}

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  paid: {
    bg: 'var(--tag-green-bg)',
    color: 'var(--tag-green-text)',
    border: 'var(--tag-green-border)',
    label: 'Оплачен',
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

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending
  return (
    <span
      style={{
        padding: '2px 8px',
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: 'var(--radius-full)',
        fontFamily: 'var(--font-ui)',
        fontSize: 10,
        fontWeight: 500,
      }}
    >
      {s.label}
    </span>
  )
}


export default function OwnerDashboardPage() {
  const now = new Date()
  const monthYear = now.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: getPlatformStats,
    refetchInterval: 60_000,
  })
  const { data: revenue } = useQuery({
    queryKey: ['revenue', now.getFullYear()],
    queryFn: () => getRevenue(now.getFullYear()),
    refetchInterval: 60_000,
  })
  const { data: payments } = useQuery({
    queryKey: ['payments', 1],
    queryFn: () => getPayments(1),
    refetchInterval: 60_000,
  })

  const revenueData = (revenue ?? []).map(r => ({
    name: monthShort(r.month),
    value: r.amount,
  }))

  const total = stats?.total_restaurants ?? 0
  const starterCount = stats?.starter_count ?? 0
  const businessCount = stats?.business_count ?? 0
  const proCount = stats?.pro_count ?? 0
  const planDist = [
    { label: 'Старт', count: starterCount, pct: total > 0 ? Math.round((starterCount / total) * 100) : 0, color: 'var(--ink-tertiary)' },
    { label: 'Бизнес', count: businessCount, pct: total > 0 ? Math.round((businessCount / total) * 100) : 0, color: 'var(--tag-green-text)' },
    { label: 'Про', count: proCount, pct: total > 0 ? Math.round((proCount / total) * 100) : 0, color: 'var(--accent-gold)' },
  ]

  const paymentRows = (payments?.items ?? []).slice(0, 10).map(p => ({
    restaurant: p.restaurant_name,
    amount: formatPrice(p.amount),
    status: <StatusBadge status={p.status} />,
    provider: p.provider,
    date: formatDate(p.created_at),
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <SectionHeading size="lg" style={{ marginBottom: 4 }}>Дашборд</SectionHeading>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-secondary)', margin: 0, textTransform: 'capitalize' }}>
          {monthYear}
        </p>
      </div>

      {/* KPI row */}
      {isLoadingStats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="80px" borderRadius="var(--radius-md)" />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}
        >
          <KPICard
            label="Ресторанов"
            value={stats?.total_restaurants ?? '—'}
            icon="🏪"
          />
          <KPICard
            label="MRR"
            value={stats ? formatPrice(stats.mrr) : '—'}
            subtitleColor="gold"
            icon="💰"
          />
          <KPICard
            label="Триал"
            value={stats?.trial_count ?? '—'}
            subtitleColor="gold"
            icon="⏱️"
          />
          <KPICard
            label="Активных"
            value={stats?.active_restaurants ?? '—'}
            subtitleColor="green"
            icon="✅"
          />
        </div>
      )}

      {/* Charts row */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}
      >
        {/* Revenue bar chart */}
        <div
          style={{
            background: 'var(--cream-surface)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-card)',
            padding: 20,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--ink-primary)',
              marginBottom: 16,
            }}
          >
            Выручка по месяцам
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={revenueData}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
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
                contentStyle={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid var(--cream-border)',
                }}
              />
              <Bar dataKey="value" fill="var(--accent-gold)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Plan distribution */}
        <div
          style={{
            background: 'var(--cream-surface)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-card)',
            padding: 20,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--ink-primary)',
              marginBottom: 16,
            }}
          >
            Распределение по тарифам
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {planDist.map(p => (
              <div key={p.label}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                    fontFamily: 'var(--font-ui)',
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: 'var(--ink-primary)' }}>{p.label}</span>
                  <span style={{ color: 'var(--ink-secondary)' }}>
                    {p.pct}% · {p.count} рест.
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    background: 'var(--cream-muted)',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${p.pct}%`,
                      background: p.color,
                      borderRadius: 4,
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent payments */}
      <div
        style={{
          background: 'var(--cream-surface)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-card)',
          padding: 20,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--ink-primary)',
            marginBottom: 16,
          }}
        >
          Последние платежи
        </div>
        <DataTable
          columns={[
            { key: 'restaurant', label: 'Ресторан' },
            { key: 'amount', label: 'Сумма', width: '100px' },
            { key: 'status', label: 'Статус', width: '90px' },
            { key: 'provider', label: 'Провайдер', width: '90px' },
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
