import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useOwnerStore } from '../store/ownerStore'
import { getApplications } from '../api/owner'
import styles from './OwnerSidebar.module.css'

const NAV = [
  { label: 'Дашборд',   icon: 'chart-bar',      path: '/dashboard' },
  { label: 'Рестораны', icon: 'building-store',  path: '/restaurants' },
  { label: 'Заявки',    icon: 'clipboard-list',  path: '/applications' },
  { label: 'Выручка',   icon: 'cash',            path: '/revenue' },
  { label: 'Система',   icon: 'server',          path: '/system' },
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
        <img src="/logo.png" alt="qrmenus.kz" className={styles.logoImg} />
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
            <i className={`ti ti-${item.icon}`} style={{ fontSize: 18, lineHeight: 1 }} />
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
