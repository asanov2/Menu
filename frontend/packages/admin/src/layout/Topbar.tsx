// === FILE: frontend/packages/admin/src/layout/Topbar.tsx ===
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import styles from './Topbar.module.css';

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
    <header className={styles.topbar}>
      <div className={styles.title}>{getTitle(pathname)}</div>

      {restaurant && (
        <div className={styles.userInfo}>
          <span className={styles.userName}>{restaurant.name}</span>
          <div className={styles.avatar}>{initials(restaurant.name)}</div>
        </div>
      )}
    </header>
  );
}
