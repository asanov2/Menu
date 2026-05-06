import { useQuery } from '@tanstack/react-query';
import { Skeleton, EmptyState, useToast, formatDate, daysUntil, ConfirmModal, TRIAL_DAYS, PLAN, getApiErrorMessage, StatusBadge, SectionHeading } from '@qrmenu/ui';
import { getSubscription, upgradeSubscription, cancelSubscription } from '../../api/billing';
import { useState } from 'react';

const PLAN_LABEL: Record<string, string> = {
  starter: 'Starter',
  business: 'Business',
  pro: 'Pro',
};

const UPGRADE_PLANS = [
  { plan: PLAN.BUSINESS, label: 'Business', price: '4 900 ₸/мес', features: ['До 5 меню', 'QR на столы', 'Аналитика 30 дней'] },
  { plan: PLAN.PRO,      label: 'Pro',      price: '9 900 ₸/мес', features: ['Безлимит меню', 'Приоритет поддержка', 'Аналитика 90 дней', 'Белый ярлык'] },
];

const CARD_STYLE: React.CSSProperties = {
  background: 'var(--cream-bg)',
  border: '0.5px solid var(--cream-border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card)',
  padding: 24,
};

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Skeleton height="200px" borderRadius="var(--radius-lg)" />
        <Skeleton height="160px" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  const trialDays = sub?.trial_ends_at ? daysUntil(sub.trial_ends_at) : 0;
  const trialProgress = Math.max(0, Math.min(100, (trialDays / TRIAL_DAYS) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Current plan */}
      {sub && (
        <div style={CARD_STYLE}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink-primary)' }}>
                {PLAN_LABEL[sub.plan] ?? sub.plan}
              </div>
              <StatusBadge status={sub.status as 'active' | 'trial' | 'expired' | 'cancelled'} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', textAlign: 'right' }}>
              <div>Следующее списание:</div>
              <div style={{ color: 'var(--ink-primary)', fontWeight: 500, marginTop: 2 }}>
                {formatDate(sub.current_period_end)}
              </div>
            </div>
          </div>

          {sub.status === 'trial' && sub.trial_ends_at && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', marginBottom: 8 }}>
                Осталось {trialDays} {trialDays === 1 ? 'день' : trialDays < 5 ? 'дня' : 'дней'} пробного периода
              </div>
              <div style={{ height: 6, background: 'var(--cream-border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--accent-gold)', width: `${trialProgress}%`, borderRadius: 3, transition: 'width 0.5s' }} />
              </div>
            </div>
          )}

          {sub.plan !== PLAN.PRO && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 8 }}>
              {UPGRADE_PLANS.filter((p) => {
                if (sub.plan === PLAN.STARTER) return true;
                if (sub.plan === PLAN.BUSINESS) return p.plan === PLAN.PRO;
                return false;
              }).map((p) => (
                <div key={p.plan} style={{ border: '0.5px solid var(--cream-border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--ink-primary)', marginBottom: 4 }}>{p.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', fontFamily: 'var(--font-ui)', marginBottom: 10 }}>{p.price}</div>
                  <ul style={{ margin: '0 0 14px', padding: '0 0 0 16px', fontSize: 12, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', lineHeight: 1.8 }}>
                    {p.features.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(p.plan)}
                    disabled={upgradingPlan === p.plan}
                    style={{ width: '100%', padding: '8px', background: 'var(--ink-primary)', color: 'var(--cream-surface)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, fontFamily: 'var(--font-ui)', cursor: upgradingPlan === p.plan ? 'not-allowed' : 'pointer', opacity: upgradingPlan === p.plan ? 0.7 : 1 }}
                  >
                    {upgradingPlan === p.plan ? '...' : `Перейти на ${p.label}`}
                  </button>
                </div>
              ))}
            </div>
          )}

          {sub.status === 'active' && (
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button onClick={() => setShowCancelModal(true)} disabled={cancelling} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', textDecoration: 'underline' }}>
                {cancelling ? 'Отмена...' : 'Отменить подписку'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Payment history */}
      <div style={CARD_STYLE}>
        <SectionHeading>История платежей</SectionHeading>
        {payments.length === 0 ? (
          <EmptyState icon="💳" title="Нет платежей" description="История платежей появится после первой оплаты" />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'var(--font-ui)' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--cream-border)' }}>
                {['Дата', 'Сумма', 'Статус', 'Провайдер'].map((h) => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 11, color: 'var(--ink-secondary)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: '0.5px solid var(--cream-border)' }}>
                  <td style={{ padding: '10px 8px', color: 'var(--ink-secondary)' }}>{formatDate(p.created_at)}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--ink-primary)', fontWeight: 500 }}>{p.amount.toLocaleString('ru-RU')} ₸</td>
                  <td style={{ padding: '10px 8px' }}>
                    <StatusBadge
                      status={p.status === 'success' ? 'online' : p.status as 'failed' | 'pending'}
                      label={p.status === 'success' ? 'Оплачен' : p.status === 'pending' ? 'Ожидание' : 'Ошибка'}
                    />
                  </td>
                  <td style={{ padding: '10px 8px', color: 'var(--ink-secondary)' }}>{p.provider}</td>
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
