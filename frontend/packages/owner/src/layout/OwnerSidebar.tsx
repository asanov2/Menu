import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useOwnerStore } from '../store/ownerStore'
import { getApplications } from '../api/owner'
import styles from './OwnerSidebar.module.css'

const NAV = [
  { label: 'Дашборд',   icon: '📊', path: '/dashboard' },
  { label: 'Рестораны', icon: '🏪', path: '/restaurants' },
  { label: 'Заявки',    icon: '📋', path: '/applications' },
  { label: 'Выручка',   icon: '💰', path: '/revenue' },
  { label: 'Система',   icon: '🖥️', path: '/system' },
]

export default function OwnerSidebar() {
  const logout = useOwnerStore(s => s.logout)

  const { data: applications } = useQuery({
    queryKey: ['applications', 1],
    queryFn: () => getApplications(1, 1),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })

  const pendingCount = applications?.total ?? 0

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
            <span className={styles.navLabel}>{item.label}</span>
            {item.path === '/applications' && pendingCount > 0 && (
              <span className={styles.navBadge}>{pendingCount}</span>
            )}
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
