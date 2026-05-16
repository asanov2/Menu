import { CSSProperties, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatPrice, formatDate, EmptyState, KPICard, SectionHeading } from '@qrmenu/ui'
import { getRevenue, getPayments, getPlatformStats } from '../../api/owner'
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

function escapeCSV(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
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
  const now = new Date()

  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: getPlatformStats,
  })
  const { data: revenue, error: revenueError, refetch: refetchRevenue } = useQuery({
    queryKey: ['revenue', now.getFullYear()],
    queryFn: () => getRevenue(now.getFullYear()),
  })
  const { data: payments } = useQuery({
    queryKey: ['payments', page],
    queryFn: () => getPayments(page),
    placeholderData: keepPreviousData,
  })

  const revenueData = (revenue ?? []).map(r => ({
    name: monthShort(r.month),
    value: r.amount,
  }))

  const yearTotal = (revenue ?? []).reduce((s, r) => s + r.amount, 0)
  const avgCheck =
    payments?.total && yearTotal > 0
      ? Math.round(yearTotal / payments.total)
      : 0

  const rows = (payments?.items ?? []).map(p => {
    const s = STATUS_STYLE[p.status] ?? STATUS_STYLE.pending
    return {
      date: formatDate(p.created_at),
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
      provider: p.provider,
    }
  })

  const handleExport = () => {
    const headers = ['Дата', 'Ресторан', 'Сумма', 'Статус', 'Провайдер']
    const csvRows = (payments?.items ?? []).map(p =>
      [p.created_at, p.restaurant_name, p.amount, p.status, p.provider]
        .map(escapeCSV)
        .join(','),
    )
    const csv = [headers.map(escapeCSV).join(','), ...csvRows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'revenue-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const total = payments?.total ?? 0
  const pages = payments?.pages ?? 1

  return (
    <div className={common.pageStack}>
      <SectionHeading size="lg" className={common.mb0}>Выручка</SectionHeading>

      <div className={common.kpiGrid3}>
        <KPICard label="МРР (текущий)" value={stats ? formatPrice(stats.mrr) : '—'} subtitleColor="gold" icon="📈" />
        <KPICard label="Всего за год" value={formatPrice(yearTotal)} subtitleColor="default" icon="💎" />
        <KPICard label="Средний чек" value={avgCheck ? formatPrice(avgCheck) : '—'} subtitleColor="default" icon="🧾" />
      </div>

      <div className={common.card}>
        <div className={common.cardTitle}>Выручка по месяцам (12 мес.)</div>
        {revenueError ? (
          <EmptyState
            icon="⚠️"
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
              <Bar dataKey="value" fill="var(--accent-gold)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className={common.card}>
        <div className={styles.paymentsHeader}>
          <div className={`${common.cardTitle} ${common.mb0}`}>Платежи</div>
          <button onClick={handleExport} className={styles.exportBtn}>
            ⬇ Экспорт CSV
          </button>
        </div>

        <DataTable
          columns={[
            { key: 'date', label: 'Дата', width: '100px' },
            { key: 'restaurant', label: 'Ресторан' },
            { key: 'amount', label: 'Сумма', width: '110px' },
            { key: 'status', label: 'Статус', width: '90px' },
            { key: 'provider', label: 'Провайдер', width: '90px' },
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
