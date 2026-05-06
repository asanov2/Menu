// === FILE: frontend/packages/owner/src/pages/System/SystemPage.tsx ===
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@qrmenu/ui'
import { getSystemHealth } from '../../api/owner'
import StatusDot from '../../components/StatusDot'

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
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
            Статус системы
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 11,
              color: 'var(--ink-secondary)',
              margin: '4px 0 0',
            }}
          >
            Обновляется каждые 30 секунд
          </p>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            color: 'var(--ink-secondary)',
            marginTop: 4,
          }}
        >
          Последняя проверка: {lastUpdated}
        </span>
      </div>

      {hasOffline && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--error-bg)',
            border: '1px solid var(--error-border)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-ui)',
            fontSize: 13,
            color: 'var(--error-text)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          ⚠️ Обнаружены проблемы с сервисами
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}
      >
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
                  style={{
                    background: isOffline ? 'var(--error-bg)' : 'var(--cream-surface)',
                    border: `0.5px solid ${isOffline ? 'var(--error-border)' : 'var(--cream-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '16px 20px',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--ink-primary)',
                      }}
                    >
                      {svc.name}
                    </span>
                    <StatusDot status={svc.status} showLabel />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 11,
                        color: 'var(--ink-secondary)',
                      }}
                    >
                      Последняя проверка: {checkedAt}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 11,
                        color: 'var(--ink-secondary)',
                        fontWeight: 500,
                      }}
                    >
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
