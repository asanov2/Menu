import { useLocation } from 'react-router-dom'
import { useOwnerStore } from '../store/ownerStore'
import styles from './OwnerTopbar.module.css'

const TITLES: Record<string, string> = {
  '/dashboard': 'Дашборд',
  '/restaurants': 'Рестораны',
  '/revenue': 'Выручка',
  '/system': 'Статус системы',
}

export default function OwnerTopbar() {
  const { pathname } = useLocation()
  const logout = useOwnerStore(s => s.logout)
  const title = TITLES[pathname] ?? 'Owner'

  return (
    <header className={styles.topbar}>
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.rightSection}>
        <span className={styles.ownerBadge}>owner</span>
        <button onClick={logout} title="Выйти" className={styles.logoutBtn}>
          ⏻
        </button>
      </div>
    </header>
  )
}
