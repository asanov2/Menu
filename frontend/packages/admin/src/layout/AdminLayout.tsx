import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import MobileTabBar from './MobileTabBar';
import TrialBanner from '../components/TrialBanner';
import styles from './AdminLayout.module.css';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <TrialBanner />
        <main className={styles.content}>
          {children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
