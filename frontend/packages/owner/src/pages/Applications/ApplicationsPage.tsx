import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ConfirmModal, Skeleton, useToast } from '@qrmenu/ui'
import {
  getApplications,
  approveApplication,
  rejectApplication,
  type ApplicationItem,
} from '../../api/owner'
import PaginationBar from '../Restaurants/components/PaginationBar'
import common from '../../styles/common.module.css'
import styles from './ApplicationsPage.module.css'

const LIMIT = 20

type ConfirmAction = { restaurant: ApplicationItem; action: 'approve' | 'reject' }

export default function ApplicationsPage() {
  const [page, setPage] = useState(1)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const qc = useQueryClient()
  const { showToast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['applications', page],
    queryFn: () => getApplications(page, LIMIT),
  })

  const approveMut = useMutation({
    mutationFn: (id: string) => approveApplication(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      showToast(`✅ Ресторан одобрен`, 'success')
      setConfirmAction(null)
    },
    onError: () => showToast('Ошибка при одобрении', 'error'),
  })

  const rejectMut = useMutation({
    mutationFn: (id: string) => rejectApplication(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      showToast('Заявка отклонена', 'success')
      setConfirmAction(null)
    },
    onError: () => showToast('Ошибка при отклонении', 'error'),
  })

  const handleConfirm = () => {
    if (!confirmAction) return
    const { restaurant, action } = confirmAction
    if (action === 'approve') approveMut.mutate(restaurant.id)
    else rejectMut.mutate(restaurant.id)
  }

  const isPending = approveMut.isPending || rejectMut.isPending
  const total = data?.total ?? 0
  const pages = data?.pages ?? 1

  return (
    <div className={common.pageStackSm}>
      <div className={common.card}>
        <div className={styles.header}>
          <div className={common.cardTitle}>Заявки на регистрацию</div>
          {!isLoading && (
            <div className={styles.count}>{total} {total === 1 ? 'заявка' : 'заявок'}</div>
          )}
        </div>

        {isLoading ? (
          <div className={styles.skeletonList}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height="52px" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🎉</span>
            <div className={styles.emptyText}>Новых заявок нет</div>
          </div>
        ) : (
          <div className={common.tableWrapper}>
            <table className={common.table}>
              <thead>
                <tr className={common.theadRow}>
                  <th className={common.th}>Заведение</th>
                  <th className={common.th}>Контакты</th>
                  <th className={common.th}>Город / Тип</th>
                  <th className={common.th}>Дата заявки</th>
                  <th className={`${common.th} ${styles.thActions}`}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className={styles.row}>
                    <td className={common.td}>
                      <div className={styles.name}>{item.name}</div>
                      <div className={styles.slug}>/{item.slug}</div>
                    </td>
                    <td className={common.td}>
                      <div>{item.email}</div>
                      {item.phone && <div className={styles.sub}>{item.phone}</div>}
                    </td>
                    <td className={common.td}>
                      {item.city && <div>{item.city}</div>}
                      {item.type && <div className={styles.sub}>{item.type}</div>}
                      {!item.city && !item.type && <span className={styles.sub}>—</span>}
                    </td>
                    <td className={common.td}>
                      {new Date(item.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td className={styles.tdActions}>
                      <button
                        className={styles.btnApprove}
                        onClick={() => setConfirmAction({ restaurant: item, action: 'approve' })}
                        disabled={isPending}
                      >
                        ✅ Одобрить
                      </button>
                      <button
                        className={styles.btnReject}
                        onClick={() => setConfirmAction({ restaurant: item, action: 'reject' })}
                        disabled={isPending}
                      >
                        ❌ Отклонить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <PaginationBar
          page={page}
          totalPages={pages}
          totalCount={total}
          pageSize={LIMIT}
          onPageChange={setPage}
        />
      </div>

      <ConfirmModal
        isOpen={!!confirmAction}
        title={
          confirmAction?.action === 'approve'
            ? 'Одобрить заявку?'
            : 'Отклонить заявку?'
        }
        message={
          confirmAction?.action === 'approve'
            ? `Ресторан «${confirmAction?.restaurant.name}» получит доступ к панели управления.`
            : `Заявка от «${confirmAction?.restaurant.name}» будет отклонена. Ресторан не сможет войти в систему.`
        }
        confirmText={confirmAction?.action === 'approve' ? 'Одобрить' : 'Отклонить'}
        cancelText="Отмена"
        danger={confirmAction?.action === 'reject'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
