import { NavLink } from 'react-router-dom'
import styles from './OwnerMobileTabBar.module.css'

const TABS = [
  { label: 'Дашборд',   icon: 'chart-bar',     path: '/dashboard' },
  { label: 'Рестораны', icon: 'building-store', path: '/restaurants' },
  { label: 'Выручка',   icon: 'cash',           path: '/revenue' },
  { label: 'Система',   icon: 'server',         path: '/system' },
]

export default function OwnerMobileTabBar() {
  return (
    <nav className={styles.tabBar}>
      {TABS.map(tab => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}
        >
          <span className={styles.tabIconWrap}>
            <i className={`ti ti-${tab.icon} ${styles.tabIcon}`} />
          </span>
          <span className={styles.tabLabel}>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
