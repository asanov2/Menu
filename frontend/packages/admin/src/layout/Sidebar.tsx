import { NavLink } from 'react-router-dom';
import { StatusBadge, Icon } from '@qrmenu/ui';
import { useAuth } from '../hooks/useAuth';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { icon: 'chart-bar',       label: 'Дашборд',      to: '/dashboard' },
  { icon: 'building-store',  label: 'Ресторан',     to: '/restaurant' },
  { icon: 'bell',            label: 'Уведомления',  to: '/telegram' },
  { icon: 'credit-card',     label: 'Подписка',     to: '/billing' },
  { icon: 'settings',        label: 'Профиль',      to: '/profile' },
];

export default function Sidebar() {
  const { restaurant, logout } = useAuth();

  return (
    <div className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logoSection}>
        <div className={styles.logoText}>qrmenus.kz</div>
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
            <span className={styles.navIcon}><Icon name={item.icon} size={18} /></span>
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
          <Icon name="logout" size={18} />
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );
}
