// === FILE: frontend/packages/admin/src/layout/Topbar.tsx ===
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Дашборд',
  '/menus': 'Меню',
  '/billing': 'Подписка',
  '/profile': 'Профиль',
};

function getTitle(pathname: string): string {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  if (pathname.endsWith('/qr')) return 'QR-код';
  if (/^\/menus\/[^/]+$/.test(pathname)) return 'Меню';
  return 'Панель управления';
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function Topbar() {
  const { pathname } = useLocation();
  const { restaurant } = useAuth();

  return (
    <header
      style={{
        height: 52,
        background: 'var(--cream-surface)',
        borderBottom: '0.5px solid var(--cream-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          color: 'var(--ink-primary)',
        }}
      >
        {getTitle(pathname)}
      </div>

      {restaurant && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontFamily: 'var(--font-ui)', color: 'var(--ink-secondary)' }}>
            {restaurant.name}
          </span>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--accent-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--cream-surface)',
              fontFamily: 'var(--font-ui)',
              flexShrink: 0,
            }}
          >
            {initials(restaurant.name)}
          </div>
        </div>
      )}
    </header>
  );
}
