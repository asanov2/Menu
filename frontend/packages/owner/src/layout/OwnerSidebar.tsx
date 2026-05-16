import { NavLink } from 'react-router-dom'
import { useOwnerStore } from '../store/ownerStore'
import styles from './OwnerSidebar.module.css'

const NAV = [
  { label: 'Дашборд', icon: '📊', path: '/dashboard' },
  { label: 'Рестораны', icon: '🏪', path: '/restaurants' },
  { label: 'Выручка', icon: '💰', path: '/revenue' },
  { label: 'Система', icon: '🖥️', path: '/system' },
]

export default function OwnerSidebar() {
  const logout = useOwnerStore(s => s.logout)

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoSection}>
        <div className={styles.logoText}>qrmenu.kz</div>
        <div className={styles.logoSubtext}>Платформа</div>
      </div>

      <nav className={styles.nav}>
        {NAV.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.bottom}>
        <div className={styles.ownerBadge}>
          <span className={styles.ownerBadgeText}>owner</span>
        </div>
        <button onClick={logout} className={styles.logoutBtn}>
          Выйти →
        </button>
      </div>
    </aside>
  )
}
