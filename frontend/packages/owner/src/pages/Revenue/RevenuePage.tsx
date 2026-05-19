import { CSSProperties, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatPrice, EmptyState, KPICard, SectionHeading } from '@qrmenu/ui'
import { getRevenue, getPayments, getPlatformStats, getAllPayments } from '../../api/owner'
import DataTable from '../../components/DataTable'
import PaginationBar from '../Restaurants/components/PaginationBar'
import common from '../../styles/common.module.css'
import styles from './RevenuePage.module.css'

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

function escapeCSV(value: string | number | null | undefined): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
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

const PLAN_LABEL: Record<string, string> = {
  starter: 'Старт',
  business: 'Бизнес',
  pro: 'Про',
}

const LIMIT = 20

export default function RevenuePage() {
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const currentMonthStr = `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: getPlatformStats,
  })
  const { data: revenue, error: revenueError, refetch: refetchRevenue } = useQuery({
    queryKey: ['revenue', year],
    queryFn: () => getRevenue(year),
  })
  const { data: payments } = useQuery({
    queryKey: ['payments', page],
    queryFn: () => getPayments(page, LIMIT),
    placeholderData: keepPreviousData,
  })

  const revenueData = (revenue ?? []).map(r => ({
    name: monthShort(r.month),
    value: r.amount,
    isCurrentMonth: r.month === currentMonthStr,
  }))

  const yearTotal = (revenue ?? []).reduce((s, r) => s + r.amount, 0)
  const paying = stats?.paying_count ?? 0
  const avgCheck = paying > 0 && yearTotal > 0 ? Math.round(yearTotal / paying) : 0

  const rows = (payments?.items ?? []).map(p => {
    const s = STATUS_STYLE[p.status] ?? STATUS_STYLE.pending
    return {
      date: formatKZDate(p.created_at),
      restaurant: p.restaurant_name,
      plan: PLAN_LABEL[p.target_plan ?? ''] ?? (p.target_plan ?? '—'),
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
    }
  })

  const handleExport = async () => {
    setExporting(true)
    try {
      const all = await getAllPayments()
      const headers = ['Дата', 'Ресторан', 'Тариф', 'Сумма', 'Статус', 'Провайдер']
      const csvRows = all.map(p =>
        [
          formatKZDate(p.created_at),
          p.restaurant_name,
          PLAN_LABEL[p.target_plan ?? ''] ?? (p.target_plan ?? ''),
          p.amount,
          STATUS_STYLE[p.status]?.label ?? p.status,
          PROVIDER_LABEL[p.provider] ?? p.provider,
        ]
          .map(escapeCSV)
          .join(','),
      )
      const csv = [headers.map(escapeCSV).join(','), ...csvRows].join('\n')
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payments-${year}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const total = payments?.total ?? 0
  const pages = payments?.pages ?? 1

  return (
    <div className={common.pageStack}>
      <SectionHeading size="lg" className={common.mb0}>Выручка</SectionHeading>

      <div className={common.kpiGrid3}>
        <KPICard label="МРР (текущий)" value={stats ? formatPrice(stats.mrr) : '—'} subtitleColor="gold" icon="trending-up" />
        <KPICard label={`Всего за ${year}`} value={formatPrice(yearTotal)} subtitleColor="default" icon="diamond" />
        <KPICard label="ARPU" value={avgCheck ? formatPrice(avgCheck) : '—'} subtitleColor="default" icon="receipt" />
      </div>

      <div className={common.card}>
        <div className={styles.paymentsHeader}>
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
        {revenueError ? (
          <EmptyState
            icon={<i className="ti ti-alert-triangle" style={{ fontSize: 40 }} />}
            title="Ошибка загрузки"
            description="Не удалось загрузить данные выручки"
            action={
              <button onClick={() => refetchRevenue()} className={styles.retryBtn}>
                Повторить
              </button>
            }
          />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
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
        )}
      </div>

      <div className={common.card}>
        <div className={styles.paymentsHeader}>
          <div className={`${common.cardTitle} ${common.mb0}`}>Платежи</div>
          <button onClick={handleExport} disabled={exporting} className={styles.exportBtn}>
            {exporting ? '...' : '⬇ Экспорт CSV'}
          </button>
        </div>

        <DataTable
          columns={[
            { key: 'date', label: 'Дата', width: '100px' },
            { key: 'restaurant', label: 'Ресторан' },
            { key: 'plan', label: 'Тариф', width: '80px' },
            { key: 'amount', label: 'Сумма', width: '110px' },
            { key: 'status', label: 'Статус', width: '90px' },
            { key: 'provider', label: 'Провайдер', width: '100px' },
          ]}
          rows={rows}
          loading={!payments}
          emptyMessage="Нет платежей"
        />

        <PaginationBar page={page} totalPages={pages} totalCount={total} pageSize={LIMIT} onPageChange={setPage} />
      </div>
    </div>
  )
}
