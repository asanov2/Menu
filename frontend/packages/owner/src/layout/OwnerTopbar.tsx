// === FILE: frontend/packages/owner/src/layout/OwnerTopbar.tsx ===
import { useLocation } from 'react-router-dom'
import { useOwnerStore } from '../store/ownerStore'

const TITLES: Record<string, string> = {
  '/dashboard': 'Дашборд',
  '/restaurants': 'Рестораны',
  '/revenue': 'Выручка',
  '/system': 'Статус системы',
}

export default function OwnerTopbar() {
  const { pathname } = useLocation()
  const logout = useOwnerStore(s => s.logout)
  const title = TITLES[pathname] ?? 'Owner'

  return (
    <header
      style={{
        height: 56,
        background: 'var(--cream-surface)',
        borderBottom: '1px solid var(--cream-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--ink-primary)',
          margin: 0,
        }}
      >
        {title}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            padding: '3px 10px',
            background: 'rgba(212,168,83,0.12)',
            border: '1px solid var(--accent-gold-border)',
            borderRadius: 'var(--radius-full)',
            fontFamily: 'var(--font-ui)',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--accent-gold)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          owner
        </span>
        <button
          onClick={logout}
          title="Выйти"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: 'var(--ink-secondary)',
            fontSize: 16,
            lineHeight: 1,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e =>
            ((e.currentTarget as HTMLButtonElement).style.color =
              'var(--ink-primary)')
          }
          onMouseLeave={e =>
            ((e.currentTarget as HTMLButtonElement).style.color =
              'var(--ink-secondary)')
          }
        >
          ⏻
        </button>
      </div>
    </header>
  )
}
