import { NavLink } from 'react-router-dom';
import { StatusBadge } from '@qrmenu/ui';
import { useAuth } from '../hooks/useAuth';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { icon: '📊', label: 'Дашборд', to: '/dashboard' },
  { icon: '🍽️', label: 'Меню', to: '/menus' },
  { icon: '💳', label: 'Подписка', to: '/billing' },
  { icon: '⚙️', label: 'Профиль', to: '/profile' },
];

export default function Sidebar() {
  const { restaurant, logout } = useAuth();

  return (
    <div className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logoSection}>
        <div className={styles.logoText}>qrmenu.kz</div>
        <div className={styles.logoDivider} />
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className={styles.bottom}>
        <div className={styles.bottomDivider} />

        {restaurant && (
          <div className={styles.restaurantInfo}>
            <div className={styles.restaurantName}>{restaurant.name}</div>
            <StatusBadge status={restaurant.plan as 'starter' | 'business' | 'pro'} />
          </div>
        )}

        <button onClick={logout} className={styles.logoutBtn}>
          <span>🚪</span>
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );
}
