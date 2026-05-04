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
import { formatPrice, formatDate } from '@qrmenu/ui'
import { getPlatformStats, getRevenue, getPayments } from '../../api/owner'
import KPICard from '../../components/KPICard'
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

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span
      style={{
        padding: '2px 8px',
        background: 'var(--accent-gold-bg)',
        color: 'var(--accent-gold)',
        border: '1px solid var(--accent-gold-border)',
        borderRadius: 'var(--radius-full)',
        fontFamily: 'var(--font-ui)',
        fontSize: 10,
        fontWeight: 500,
      }}
    >
      {plan}
    </span>
  )
}

export default function OwnerDashboardPage() {
  const now = new Date()
  const monthYear = now.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })

  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: getPlatformStats,
    refetchInterval: 60_000,
  })
  const { data: revenue } = useQuery({
    queryKey: ['revenue', 6],
    queryFn: () => getRevenue(6),
    refetchInterval: 60_000,
  })
  const { data: payments } = useQuery({
    queryKey: ['payments', 1],
    queryFn: () => getPayments(1),
    refetchInterval: 60_000,
  })

  const revenueData = (revenue ?? []).map(r => ({
    name: monthShort(r.month),
    value: r.total_kzt,
  }))

  const total = stats?.total_restaurants ?? 0
  const planDist = [
    { label: 'Старт', count: Math.round(total * 0.58), pct: 58, color: 'var(--ink-tertiary)' },
    { label: 'Бизнес', count: Math.round(total * 0.28), pct: 28, color: '#4A8A30' },
    { label: 'Про', count: Math.round(total * 0.14), pct: 14, color: 'var(--accent-gold)' },
  ]

  const paymentRows = (payments?.items ?? []).slice(0, 10).map(p => ({
    restaurant: p.restaurant_name,
    plan: <PlanBadge plan={p.plan} />,
    amount: formatPrice(p.amount),
    status: <StatusBadge status={p.status} />,
    date: formatDate(p.paid_at),
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 600,
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          Дашборд
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 12,
            color: 'var(--ink-secondary)',
            margin: '4px 0 0',
            textTransform: 'capitalize',
          }}
        >
          {monthYear}
        </p>
      </div>

      {/* KPI row */}
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
          sub={`+${stats?.new_this_month ?? 0} этот месяц`}
          subColor="green"
          icon="🏪"
        />
        <KPICard
          label="MRR"
          value={stats ? formatPrice(stats.mrr_kzt) : '—'}
          sub="+18%"
          subColor="gold"
          icon="💰"
        />
        <KPICard
          label="Триал"
          value={stats?.trial_restaurants ?? '—'}
          sub={`конверсия ${stats ? Math.round(stats.conversion_rate * 100) : 0}%`}
          subColor="gold"
          icon="⏱️"
        />
        <KPICard
          label="Churn"
          value={stats?.churn_this_month ?? '—'}
          sub="этот месяц"
          subColor="red"
          icon="📉"
        />
      </div>

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
                tick={{ fontFamily: 'var(--font-ui)', fontSize: 11, fill: '#A09080' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontFamily: 'var(--font-ui)', fontSize: 10, fill: '#A09080' }}
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
            { key: 'plan', label: 'План', width: '80px' },
            { key: 'amount', label: 'Сумма', width: '100px' },
            { key: 'status', label: 'Статус', width: '90px' },
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
