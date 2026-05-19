import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@qrmenu/ui'
import { getSystemHealth } from '../../api/owner'
import StatusDot from '../../components/StatusDot'
import common from '../../styles/common.module.css'
import styles from './SystemPage.module.css'

export default function SystemPage() {
  const { data: health, dataUpdatedAt } = useQuery({
    queryKey: ['system-health'],
    queryFn: getSystemHealth,
    refetchInterval: 30_000,
  })

  const hasOffline = health ? !health.all_healthy : false

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '—'

  return (
    <div className={common.pageStackSm}>
      <div className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <h2 className={styles.systemTitle}>Статус системы</h2>
          <p className={styles.systemSubtitle}>Обновляется каждые 30 секунд</p>
        </div>
        <span className={styles.lastChecked}>Последняя проверка: {lastUpdated}</span>
      </div>

      {hasOffline && (
        <div className={styles.errorAlert}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 16, lineHeight: 1 }} /> Обнаружены проблемы с сервисами
        </div>
      )}

      <div className={styles.servicesGrid}>
        {health
          ? health.services.map(svc => {
              const isOffline = svc.status === 'offline'
              const checkedAt = new Date(svc.checked_at).toLocaleTimeString(
                'ru-RU',
                { hour: '2-digit', minute: '2-digit', second: '2-digit' },
              )
              return (
                <div
                  key={svc.name}
                  className={`${styles.serviceCard} ${isOffline ? styles.serviceCardOffline : ''}`}
                >
                  <div className={styles.serviceTop}>
                    <span className={styles.serviceName}>{svc.name}</span>
                    <StatusDot status={svc.status} showLabel />
                  </div>
                  <div className={styles.serviceBottom}>
                    <span className={styles.serviceTime}>Последняя проверка: {checkedAt}</span>
                    <span className={styles.serviceMs}>
                      {svc.response_ms != null ? `${svc.response_ms}ms` : '—'}
                    </span>
                  </div>
                </div>
              )
            })
          : Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height="80px" borderRadius="var(--radius-md)" />
            ))}
      </div>
    </div>
  )
}
