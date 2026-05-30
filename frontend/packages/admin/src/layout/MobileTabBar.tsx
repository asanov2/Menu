import { NavLink } from 'react-router-dom';
import { Icon } from '@qrmenu/ui';
import styles from './MobileTabBar.module.css';

const TABS = [
  { icon: 'chart-bar',       label: 'Дашборд',     to: '/dashboard' },
  { icon: 'building-store',  label: 'Ресторан',    to: '/restaurant' },
  { icon: 'bell',            label: 'Уведомл.',    to: '/telegram' },
  { icon: 'credit-card',     label: 'Подписка',    to: '/billing' },
  { icon: 'settings',        label: 'Профиль',     to: '/profile' },
];

export default function MobileTabBar() {
  return (
    <nav className={styles.tabBar}>
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}
        >
          <span className={styles.tabIcon}><Icon name={tab.icon} size={22} /></span>
          <span className={styles.tabLabel}>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
