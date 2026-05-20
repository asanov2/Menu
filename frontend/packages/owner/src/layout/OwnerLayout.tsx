import { ReactNode } from 'react'
import OwnerSidebar from './OwnerSidebar'
import OwnerTopbar from './OwnerTopbar'
import OwnerMobileTabBar from './OwnerMobileTabBar'
import styles from './OwnerLayout.module.css'

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <OwnerSidebar />
      <div className={styles.main}>
        <OwnerTopbar />
        <main className={styles.content}>
          {children}
        </main>
      </div>
      <OwnerMobileTabBar />
    </div>
  )
}
