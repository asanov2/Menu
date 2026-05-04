// === FILE: frontend/packages/owner/src/pages/Revenue/RevenuePage.tsx ===
import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatPrice, formatDate } from '@qrmenu/ui'
import { getRevenue, getPayments, getPlatformStats } from '../../api/owner'
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

const LIMIT = 20

export default function RevenuePage() {
  const [page, setPage] = useState(1)

  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: getPlatformStats,
  })
  const { data: revenue } = useQuery({
    queryKey: ['revenue', 12],
    queryFn: () => getRevenue(12),
  })
  const { data: payments } = useQuery({
    queryKey: ['payments', page],
    queryFn: () => getPayments(page),
    placeholderData: keepPreviousData,
  })

  const revenueData = (revenue ?? []).map(r => ({
    name: monthShort(r.month),
    value: r.total_kzt,
  }))

  const yearTotal = (revenue ?? []).reduce((s, r) => s + r.total_kzt, 0)
  const avgCheck =
    payments?.total && yearTotal > 0
      ? Math.round(yearTotal / payments.total)
      : 0

  const rows = (payments?.items ?? []).map(p => {
    const s = STATUS_STYLE[p.status] ?? STATUS_STYLE.pending
    return {
      date: formatDate(p.paid_at),
      restaurant: p.restaurant_name,
      amount: formatPrice(p.amount),
      plan: p.plan,
      status: (
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
      ),
      provider: p.provider,
    }
  })

  const handleExport = () => {
    const headers = ['Дата', 'Ресторан', 'Сумма', 'Тариф', 'Статус', 'Провайдер']
    const csvRows = (payments?.items ?? []).map(p =>
      [p.paid_at, p.restaurant_name, p.amount, p.plan, p.status, p.provider].join(','),
    )
    const csv = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'revenue-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const total = payments?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / LIMIT))
  const from = total === 0 ? 0 : (page - 1) * LIMIT + 1
  const to = Math.min(page * LIMIT, total)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 600,
          color: 'var(--ink-primary)',
          margin: 0,
        }}
      >
        Выручка
      </h2>

      {/* Summary KPI */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}
      >
        <KPICard
          label="МРР (текущий)"
          value={stats ? formatPrice(stats.mrr_kzt) : '—'}
          subColor="gold"
          icon="📈"
        />
        <KPICard
          label="Всего за год"
          value={formatPrice(yearTotal)}
          subColor="default"
          icon="💎"
        />
        <KPICard
          label="Средний чек"
          value={avgCheck ? formatPrice(avgCheck) : '—'}
          subColor="default"
          icon="🧾"
        />
      </div>

      {/* Revenue chart */}
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
          Выручка по месяцам (12 мес.)
        </div>
        <ResponsiveContainer width="100%" height={240}>
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

      {/* Payments table */}
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--ink-primary)',
            }}
          >
            Платежи
          </div>
          <button
            onClick={handleExport}
            style={{
              padding: '6px 14px',
              fontFamily: 'var(--font-ui)',
              fontSize: 11,
              fontWeight: 500,
              border: '1px solid var(--cream-border)',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              color: 'var(--ink-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ⬇ Экспорт CSV
          </button>
        </div>

        <DataTable
          columns={[
            { key: 'date', label: 'Дата', width: '100px' },
            { key: 'restaurant', label: 'Ресторан' },
            { key: 'amount', label: 'Сумма', width: '110px' },
            { key: 'plan', label: 'Тариф', width: '80px' },
            { key: 'status', label: 'Статус', width: '90px' },
            { key: 'provider', label: 'Провайдер', width: '90px' },
          ]}
          rows={rows}
          loading={!payments}
          emptyMessage="Нет платежей"
        />

        {total > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 16,
              paddingTop: 12,
              borderTop: '1px solid var(--cream-border)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 12,
                color: 'var(--ink-secondary)',
              }}
            >
              {from}–{to} из {total}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '5px 12px',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 12,
                  border: '1px solid var(--cream-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  color: page === 1 ? 'var(--ink-tertiary)' : 'var(--ink-primary)',
                  cursor: page === 1 ? 'default' : 'pointer',
                }}
              >
                ← Назад
              </button>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page >= pages}
                style={{
                  padding: '5px 12px',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 12,
                  border: '1px solid var(--cream-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  color: page >= pages ? 'var(--ink-tertiary)' : 'var(--ink-primary)',
                  cursor: page >= pages ? 'default' : 'pointer',
                }}
              >
                Вперёд →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
