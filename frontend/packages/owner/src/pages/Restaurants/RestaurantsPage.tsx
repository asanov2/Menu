// === FILE: frontend/packages/owner/src/pages/Restaurants/RestaurantsPage.tsx ===
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { formatDate } from '@qrmenu/ui'
import { ConfirmModal } from '@qrmenu/ui'
import { useToast } from '@qrmenu/ui'
import {
  getRestaurants,
  updateRestaurant,
  type OwnerRestaurant,
} from '../../api/owner'
import DataTable from '../../components/DataTable'

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string; label: string }> = {
  active: {
    bg: 'var(--tag-green-bg)',
    color: 'var(--tag-green-text)',
    border: 'var(--tag-green-border)',
    label: 'Активен',
  },
  trial: {
    bg: 'var(--accent-gold-bg)',
    color: 'var(--accent-gold)',
    border: 'var(--accent-gold-border)',
    label: 'Триал',
  },
  expired: {
    bg: 'var(--tag-red-bg)',
    color: 'var(--tag-red-text)',
    border: 'var(--tag-red-border)',
    label: 'Истёк',
  },
}

const FILTERS = ['Все', 'Старт', 'Бизнес', 'Про', 'Триал', 'Истёк']
const FILTER_PARAMS: Record<string, { plan?: string; status?: string }> = {
  'Все': {},
  'Старт': { plan: 'starter' },
  'Бизнес': { plan: 'business' },
  'Про': { plan: 'pro' },
  'Триал': { status: 'trial' },
  'Истёк': { status: 'expired' },
}

const LIMIT = 20

export default function RestaurantsPage() {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('Все')
  const [page, setPage] = useState(1)
  const [confirmTarget, setConfirmTarget] = useState<OwnerRestaurant | null>(null)
  const qc = useQueryClient()
  const { showToast } = useToast()

  const filterParams = FILTER_PARAMS[activeFilter] ?? {}

  const { data, isLoading } = useQuery({
    queryKey: ['restaurants', search, filterParams, page],
    queryFn: () => getRestaurants({ search, ...filterParams, page, limit: LIMIT }),
    placeholderData: keepPreviousData,
  })

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { is_active?: boolean; plan?: string } }) =>
      updateRestaurant(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurants'] })
      showToast('Изменения сохранены', 'success')
    },
    onError: () => showToast('Ошибка при сохранении', 'error'),
  })

  const handleToggleActive = (r: OwnerRestaurant) => {
    if (r.is_active) {
      setConfirmTarget(r)
    } else {
      updateMut.mutate({ id: r.id, patch: { is_active: true } })
    }
  }

  const rows = (data?.items ?? []).map(r => ({
    name: (
      <span style={{ opacity: r.is_active ? 1 : 0.6 }}>
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--ink-primary)',
          }}
        >
          {r.name}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 10,
            color: 'var(--ink-secondary)',
          }}
        >
          {r.slug}
        </div>
      </span>
    ),
    plan: (
      <select
        defaultValue={r.plan}
        onChange={e => updateMut.mutate({ id: r.id, patch: { plan: e.target.value } })}
        onClick={e => e.stopPropagation()}
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 11,
          border: '1px solid var(--cream-border)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--cream-bg)',
          color: 'var(--ink-primary)',
          padding: '2px 6px',
          cursor: 'pointer',
        }}
      >
        <option value="starter">Старт</option>
        <option value="business">Бизнес</option>
        <option value="pro">Про</option>
      </select>
    ),
    status: (() => {
      const s = STATUS_COLORS[r.status] ?? STATUS_COLORS.active
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
    })(),
    created: formatDate(r.created_at),
    trial_ends: r.trial_ends_at ? formatDate(r.trial_ends_at) : '—',
    actions: (
      <button
        onClick={e => { e.stopPropagation(); handleToggleActive(r) }}
        style={{
          padding: '4px 10px',
          fontFamily: 'var(--font-ui)',
          fontSize: 11,
          border: `1px solid ${r.is_active ? 'var(--error-border)' : 'var(--tag-green-border)'}`,
          background: r.is_active ? 'var(--tag-red-bg)' : 'var(--tag-green-bg)',
          color: r.is_active ? 'var(--tag-red-text)' : 'var(--tag-green-text)',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {r.is_active ? 'Деактивировать' : 'Активировать'}
      </button>
    ),
  }))

  const total = data?.total ?? 0
  const pages = data?.pages ?? 1
  const from = total === 0 ? 0 : (page - 1) * LIMIT + 1
  const to = Math.min(page * LIMIT, total)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 600,
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          Рестораны
        </h2>
        <span
          style={{
            padding: '3px 10px',
            background: 'var(--cream-muted)',
            borderRadius: 'var(--radius-full)',
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            color: 'var(--ink-secondary)',
          }}
        >
          {total}
        </span>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ position: 'relative', maxWidth: 340 }}>
          <span
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ink-secondary)',
              fontSize: 13,
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Поиск по названию или slug..."
            style={{
              width: '100%',
              paddingLeft: 32,
              paddingRight: 12,
              paddingTop: 8,
              paddingBottom: 8,
              fontFamily: 'var(--font-ui)',
              fontSize: 13,
              border: '1px solid var(--cream-border)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--cream-surface)',
              color: 'var(--ink-primary)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => { setActiveFilter(f); setPage(1) }}
              style={{
                padding: '4px 12px',
                fontFamily: 'var(--font-ui)',
                fontSize: 12,
                border: `1px solid ${activeFilter === f ? 'var(--ink-primary)' : 'var(--cream-border)'}`,
                background: activeFilter === f ? 'var(--ink-primary)' : 'transparent',
                color: activeFilter === f ? 'var(--cream-surface)' : 'var(--ink-secondary)',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: 'var(--cream-surface)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-card)',
          padding: 20,
        }}
      >
        <DataTable
          columns={[
            { key: 'name', label: 'Название' },
            { key: 'plan', label: 'План', width: '110px' },
            { key: 'status', label: 'Статус', width: '80px' },
            { key: 'created', label: 'Создан', width: '100px' },
            { key: 'trial_ends', label: 'Триал до', width: '100px' },
            { key: 'actions', label: 'Действия', width: '140px' },
          ]}
          rows={rows}
          loading={isLoading}
          emptyMessage="Рестораны не найдены"
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

      {/* Confirm deactivation */}
      <ConfirmModal
        isOpen={!!confirmTarget}
        title="Деактивировать ресторан?"
        message={`Ресторан «${confirmTarget?.name}» будет деактивирован. Меню станет недоступным для гостей.`}
        confirmText="Деактивировать"
        cancelText="Отмена"
        danger
        onConfirm={() => {
          if (confirmTarget) {
            updateMut.mutate({ id: confirmTarget.id, patch: { is_active: false } })
          }
          setConfirmTarget(null)
        }}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  )
}
