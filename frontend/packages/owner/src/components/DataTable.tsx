// === FILE: frontend/packages/owner/src/components/DataTable.tsx ===
import { ReactNode } from 'react'
import { Skeleton, EmptyState } from '@qrmenu/ui'

interface Column {
  key: string
  label: string
  width?: string
}

interface DataTableProps {
  columns: Column[]
  rows: Record<string, ReactNode>[]
  onRowClick?: (row: Record<string, ReactNode>) => void
  loading?: boolean
  emptyMessage?: string
}

export default function DataTable({
  columns,
  rows,
  onRowClick,
  loading,
  emptyMessage,
}: DataTableProps) {
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--cream-border)' }}>
            {columns.map(col => (
              <th
                key={col.key}
                style={{
                  width: col.width,
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--ink-secondary)',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key} style={{ padding: '6px 12px', height: 36 }}>
                    <Skeleton height="18px" width="80%" borderRadius="4px" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: '32px 0' }}>
                <EmptyState icon="📋" title={emptyMessage ?? 'Нет данных'} />
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                style={{
                  height: 36,
                  borderBottom: '1px solid var(--cream-border)',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => {
                  if (onRowClick)
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      'var(--cream-muted)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLTableRowElement).style.background = ''
                }}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    style={{
                      padding: '0 12px',
                      fontFamily: 'var(--font-ui)',
                      fontSize: 12,
                      color: 'var(--ink-primary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
