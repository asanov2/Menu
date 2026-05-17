import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getSubscription, type Subscription } from '../api/billing';
import styles from './TrialBanner.module.css';

const DISMISSED_KEY = 'trial_banner_dismissed';

const MONTHS_RU = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`;
}

function getBannerContent(sub: Subscription): { icon: string; text: string } | null {
  if (sub.status === 'expired') {
    return {
      icon: '❌',
      text: 'Пробный период завершён. Оформите подписку для восстановления доступа.',
    };
  }

  if (sub.status !== 'trial') return null;

  const endDate = sub.trial_ends_at ?? sub.current_period_end;
  const daysLeft = Math.ceil(
    (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft > 7) return null;

  if (daysLeft <= 1) {
    return {
      icon: '⚠️',
      text: 'Завтра заканчивается пробный период. Оформите подписку сегодня!',
    };
  }

  const dateStr = formatDate(endDate);
  return {
    icon: '⚠️',
    text: `До окончания пробного периода ${daysLeft} дней (до ${dateStr}). Оформите подписку.`,
  };
}

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
  const bannerContent = sub ? getBannerContent(sub) : null;

  if (!bannerContent || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className={styles.banner}>
      <div className={styles.message}>
        <span>{bannerContent.icon}</span>
        <span>{bannerContent.text}</span>
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
