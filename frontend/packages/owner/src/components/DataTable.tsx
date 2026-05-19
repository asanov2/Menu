import { ReactNode } from 'react'
import { Skeleton, EmptyState } from '@qrmenu/ui'
import styles from './DataTable.module.css'

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
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.theadRow}>
            {columns.map(col => (
              <th
                key={col.key}
                className={styles.th}
                style={{ width: col.width }}
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
                  <td key={col.key} className={styles.tdLoading}>
                    <Skeleton height="18px" width="80%" borderRadius="4px" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.tdEmpty}>
                <EmptyState icon={<i className="ti ti-clipboard-x" style={{ fontSize: 40 }} />} title={emptyMessage ?? 'Нет данных'} />
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className={`${styles.tr} ${onRowClick ? styles.trClickable : ''}`}
              >
                {columns.map(col => (
                  <td key={col.key} className={styles.td}>
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
