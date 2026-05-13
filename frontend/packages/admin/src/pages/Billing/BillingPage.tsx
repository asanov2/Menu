import { useQuery } from '@tanstack/react-query';
import { Skeleton, EmptyState, useToast, formatDate, daysUntil, ConfirmModal, TRIAL_DAYS, PLAN, getApiErrorMessage, StatusBadge, SectionHeading } from '@qrmenu/ui';
import { getSubscription, upgradeSubscription, cancelSubscription } from '../../api/billing';
import { useState } from 'react';
import styles from './BillingPage.module.css';
import common from '../../styles/common.module.css';

const PLAN_LABEL: Record<string, string> = {
  starter: 'Starter',
  business: 'Business',
  pro: 'Pro',
};

const UPGRADE_PLANS = [
  { plan: PLAN.BUSINESS, label: 'Business', price: '4 900 ₸/мес', features: ['До 5 меню', 'QR на столы', 'Аналитика 30 дней'] },
  { plan: PLAN.PRO,      label: 'Pro',      price: '9 900 ₸/мес', features: ['Безлимит меню', 'Приоритет поддержка', 'Аналитика 90 дней', 'Белый ярлык'] },
];

export default function BillingPage() {
  const { showToast } = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscription,
  });

  const sub = data?.subscription;
  const payments = data?.payments ?? [];

  const handleUpgrade = async (plan: string) => {
    setUpgradingPlan(plan);
    try {
      const result = await upgradeSubscription(plan);
      window.location.href = result.payment_url;
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Ошибка: не удалось перейти к оплате'), 'error');
    } finally {
      setUpgradingPlan(null);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelSubscription();
      refetch();
      showToast('Подписка отменена', 'success');
    } catch {
      showToast('Ошибка: не удалось отменить', 'error');
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className={common.skeletonStackMd}>
        <Skeleton height="200px" borderRadius="var(--radius-lg)" />
        <Skeleton height="160px" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  const trialDays = sub?.trial_ends_at ? daysUntil(sub.trial_ends_at) : 0;
  const trialProgress = Math.max(0, Math.min(100, (trialDays / TRIAL_DAYS) * 100));

  return (
    <div className={styles.page}>
      {/* Current plan */}
      {sub && (
        <div className={common.card}>
          <div className={styles.planHeader}>
            <div className={styles.planInfo}>
              <div className={styles.planName}>
                {PLAN_LABEL[sub.plan] ?? sub.plan}
              </div>
              <StatusBadge status={sub.status as 'active' | 'trial' | 'expired' | 'cancelled'} />
            </div>
            <div className={styles.renewalInfo}>
              <div>Следующее списание:</div>
              <div className={styles.renewalDate}>
                {formatDate(sub.current_period_end)}
              </div>
            </div>
          </div>

          {sub.status === 'trial' && sub.trial_ends_at && (
            <div className={styles.trialSection}>
              <div className={styles.trialLabel}>
                Осталось {trialDays} {trialDays === 1 ? 'день' : trialDays < 5 ? 'дня' : 'дней'} пробного периода
              </div>
              <div className={styles.trialBar}>
                <div className={styles.trialFill} style={{ width: `${trialProgress}%` }} />
              </div>
            </div>
          )}

          {sub.plan !== PLAN.PRO && (
            <div className={styles.upgradeGrid}>
              {UPGRADE_PLANS.filter((p) => {
                if (sub.plan === PLAN.STARTER) return true;
                if (sub.plan === PLAN.BUSINESS) return p.plan === PLAN.PRO;
                return false;
              }).map((p) => (
                <div key={p.plan} className={styles.upgradePlan}>
                  <div className={styles.upgradePlanName}>{p.label}</div>
                  <div className={styles.upgradePlanPrice}>{p.price}</div>
                  <ul className={styles.upgradeFeatures}>
                    {p.features.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(p.plan)}
                    disabled={upgradingPlan === p.plan}
                    className={`${styles.upgradeBtn} ${upgradingPlan === p.plan ? styles.upgradeBtnLoading : ''}`}
                  >
                    {upgradingPlan === p.plan ? '...' : `Перейти на ${p.label}`}
                  </button>
                </div>
              ))}
            </div>
          )}

          {sub.status === 'active' && (
            <div className={styles.cancelRow}>
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={cancelling}
                className={styles.cancelBtn}
              >
                {cancelling ? 'Отмена...' : 'Отменить подписку'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Payment history */}
      <div className={common.card}>
        <SectionHeading>История платежей</SectionHeading>
        {payments.length === 0 ? (
          <EmptyState icon="💳" title="Нет платежей" description="История платежей появится после первой оплаты" />
        ) : (
          <table className={common.table}>
            <thead>
              <tr className={common.theadRow}>
                {['Дата', 'Сумма', 'Статус', 'Провайдер'].map((h) => (
                  <th key={h} className={common.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className={common.tr}>
                  <td className={common.td}>{formatDate(p.created_at)}</td>
                  <td className={styles.tdAmount}>{p.amount.toLocaleString('ru-RU')} ₸</td>
                  <td className={styles.tdStatus}>
                    <StatusBadge
                      status={p.status === 'success' ? 'online' : p.status as 'failed' | 'pending'}
                      label={p.status === 'success' ? 'Оплачен' : p.status === 'pending' ? 'Ожидание' : 'Ошибка'}
                    />
                  </td>
                  <td className={common.td}>{p.provider}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        isOpen={showCancelModal}
        title="Отменить подписку?"
        message="Доступ к платным функциям сохранится до конца оплаченного периода."
        confirmText="Отменить подписку"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelModal(false)}
        danger
      />
    </div>
  );
}
