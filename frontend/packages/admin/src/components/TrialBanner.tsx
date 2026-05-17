import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getSubscription } from '../api/billing';
import styles from './TrialBanner.module.css';

const DISMISSED_KEY = 'trial_banner_dismissed';

export default function TrialBanner() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISSED_KEY) === '1'
  );

  const { data } = useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscription,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const sub = data?.subscription;

  if (!sub?.warning_banner || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className={styles.banner}>
      <div className={styles.message}>
        <span>⚠️</span>
        <span>{sub.warning_message}</span>
      </div>
      <div className={styles.actions}>
        <button className={styles.billingBtn} onClick={() => navigate('/billing')}>
          Оформить подписку →
        </button>
        <button className={styles.dismissBtn} onClick={handleDismiss} aria-label="Закрыть">
          ✕
        </button>
      </div>
    </div>
  );
}
