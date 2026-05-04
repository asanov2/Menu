// === FILE: frontend/packages/owner/src/layout/OwnerSidebar.tsx ===
import { NavLink } from 'react-router-dom'
import { useOwnerStore } from '../store/ownerStore'

const NAV = [
  { label: 'Дашборд', icon: '📊', path: '/dashboard' },
  { label: 'Рестораны', icon: '🏪', path: '/restaurants' },
  { label: 'Выручка', icon: '💰', path: '/revenue' },
  { label: 'Система', icon: '🖥️', path: '/system' },
]

export default function OwnerSidebar() {
  const logout = useOwnerStore(s => s.logout)

  return (
    <aside
      style={{
        width: 220,
        minHeight: '100vh',
        background: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            color: 'var(--sidebar-text)',
            letterSpacing: '-0.02em',
          }}
        >
          qrmenu.kz
        </div>
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 10,
            color: 'var(--sidebar-muted)',
            marginTop: 2,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Платформа
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {NAV.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 20px',
              fontFamily: 'var(--font-ui)',
              fontSize: 13,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--accent-gold)' : 'var(--sidebar-text)',
              textDecoration: 'none',
              background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
              borderLeft: isActive
                ? '2px solid var(--sidebar-active-border)'
                : '2px solid transparent',
              transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: 'rgba(212,168,83,0.15)',
            border: '1px solid var(--accent-gold)',
            borderRadius: 'var(--radius-full)',
            alignSelf: 'flex-start',
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: 'var(--accent-gold)',
              fontFamily: 'var(--font-ui)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            owner
          </span>
        </div>
        <button
          onClick={logout}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--sidebar-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: 12,
            padding: '7px 12px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e =>
            ((e.currentTarget as HTMLButtonElement).style.color =
              'var(--sidebar-text)')
          }
          onMouseLeave={e =>
            ((e.currentTarget as HTMLButtonElement).style.color =
              'var(--sidebar-muted)')
          }
        >
          Выйти →
        </button>
      </div>
    </aside>
  )
}
