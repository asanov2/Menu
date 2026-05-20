import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getApplications } from '../api/owner'
import styles from './OwnerMobileTabBar.module.css'

const TABS = [
  { label: 'Дашборд',   icon: 'chart-bar',     path: '/dashboard' },
  { label: 'Рестораны', icon: 'building-store', path: '/restaurants' },
  { label: 'Заявки',    icon: 'clipboard-list', path: '/applications' },
  { label: 'Выручка',   icon: 'cash',           path: '/revenue' },
  { label: 'Система',   icon: 'server',         path: '/system' },
]

export default function OwnerMobileTabBar() {
  const { data: applications } = useQuery({
    queryKey: ['applications', 1],
    queryFn: () => getApplications(1, 1),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
  const pendingCount = applications?.total ?? 0

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
            {tab.path === '/applications' && pendingCount > 0 && (
              <span className={styles.tabBadge}>{pendingCount > 9 ? '9+' : pendingCount}</span>
            )}
          </span>
          <span className={styles.tabLabel}>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
