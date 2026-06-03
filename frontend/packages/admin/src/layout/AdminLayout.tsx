import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import MobileTabBar from './MobileTabBar';
import TrialBanner from '../components/TrialBanner';
import SubscriptionExpiredScreen from '../components/SubscriptionExpiredScreen';
import { getSubscription } from '../api/billing';
import styles from './AdminLayout.module.css';

const ALLOWED_WHEN_EXPIRED = ['/billing', '/profile'];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { data } = useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscription,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const sub = data?.subscription;
  const isExpired = sub?.status === 'expired';
  const isAllowedPath = ALLOWED_WHEN_EXPIRED.some(p => location.pathname.startsWith(p));

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <TrialBanner />
        <main className={styles.content}>
          {isExpired && !isAllowedPath ? <SubscriptionExpiredScreen /> : children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
