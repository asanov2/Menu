// === FILE: frontend/packages/admin/src/layout/Sidebar.tsx ===
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV_ITEMS = [
  { icon: '📊', label: 'Дашборд', to: '/dashboard' },
  { icon: '🍽️', label: 'Меню', to: '/menus' },
  { icon: '💳', label: 'Подписка', to: '/billing' },
  { icon: '⚙️', label: 'Профиль', to: '/profile' },
];

const PLAN_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  starter:  { bg: 'var(--cream-muted)',    color: 'var(--ink-secondary)',  border: 'var(--cream-border)' },
  business: { bg: 'var(--tag-green-bg)',   color: 'var(--tag-green-text)', border: 'var(--tag-green-border)' },
  pro:      { bg: 'var(--accent-gold-bg)', color: 'var(--warning-text)',   border: 'var(--accent-gold-border)' },
  trial:    { bg: 'var(--tag-blue-bg)',    color: 'var(--tag-blue-text)',  border: 'var(--tag-blue-border)' },
};

export default function Sidebar() {
  const { restaurant, logout } = useAuth();

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        background: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '22px 16px 16px' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            color: 'var(--sidebar-text)',
            letterSpacing: '0.02em',
          }}
        >
          qrmenu.kz
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginTop: 14 }} />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: isActive ? '9px 12px 9px 9px' : '9px 12px',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontSize: 13,
              fontFamily: 'var(--font-ui)',
              fontWeight: 500,
              transition: 'background 0.15s, color 0.15s',
              background: isActive ? 'rgba(212,168,83,0.12)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--accent-gold)' : '3px solid transparent',
              color: isActive ? 'var(--sidebar-text)' : 'var(--sidebar-muted)',
            })}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              if (!el.getAttribute('aria-current')) {
                el.style.background = 'rgba(255,255,255,0.06)';
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              if (!el.getAttribute('aria-current')) {
                el.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px 12px 16px' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 12 }} />

        {restaurant && (
          <div style={{ marginBottom: 10, padding: '8px 6px' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--sidebar-text)', fontFamily: 'var(--font-ui)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {restaurant.name}
            </div>
            {(() => {
              const s = PLAN_STYLE[restaurant.plan] ?? PLAN_STYLE.starter;
              return (
                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-ui)', background: s.bg, color: s.color, border: `0.5px solid ${s.border}` }}>
                  {restaurant.plan}
                </span>
              );
            })()}
          </div>
        )}

        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: 'none',
            color: 'var(--sidebar-muted)',
            fontSize: 13,
            fontFamily: 'var(--font-ui)',
            cursor: 'pointer',
            padding: '6px 6px',
            borderRadius: 'var(--radius-md)',
            width: '100%',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--sidebar-text)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--sidebar-muted)'; }}
        >
          <span>🚪</span>
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );
}
