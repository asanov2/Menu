// === FILE: frontend/packages/admin/src/pages/Billing/BillingPage.tsx ===
import { useQuery } from '@tanstack/react-query';
import { Skeleton, EmptyState, useToast, formatDate, daysUntil } from '@qrmenu/ui';
import { getSubscription, upgradeSubscription, cancelSubscription } from '../../api/billing';
import { useState } from 'react';

const PLAN_LABEL: Record<string, string> = {
  starter: 'Starter',
  business: 'Business',
  pro: 'Pro',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Активна',
  trial: 'Пробный',
  expired: 'Истекла',
  cancelled: 'Отменена',
};

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  active: { background: 'var(--tag-green-bg)', color: 'var(--tag-green-text)', border: '0.5px solid var(--tag-green-border)' },
  trial: { background: 'var(--tag-blue-bg)', color: 'var(--tag-blue-text)', border: '0.5px solid var(--tag-blue-border)' },
  expired: { background: 'var(--tag-red-bg, #FEF2F2)', color: 'var(--tag-red-text, #B91C1C)', border: '0.5px solid var(--tag-red-border, #FECACA)' },
  cancelled: { background: 'var(--cream-muted)', color: 'var(--ink-secondary)', border: '0.5px solid var(--cream-border)' },
};

const PAYMENT_STATUS_STYLE: Record<string, React.CSSProperties> = {
  success: { background: 'var(--tag-green-bg)', color: 'var(--tag-green-text)', border: '0.5px solid var(--tag-green-border)' },
  pending: { background: 'var(--accent-gold-bg)', color: 'var(--warning-text)', border: '0.5px solid var(--accent-gold-border)' },
  failed: { background: 'var(--tag-red-bg, #FEF2F2)', color: 'var(--tag-red-text, #B91C1C)', border: '0.5px solid var(--tag-red-border, #FECACA)' },
};

const UPGRADE_PLANS = [
  { plan: 'business', label: 'Business', price: '4 900 ₸/мес', features: ['До 5 меню', 'QR на столы', 'Аналитика 30 дней'] },
  { plan: 'pro', label: 'Pro', price: '9 900 ₸/мес', features: ['Безлимит меню', 'Приоритет поддержка', 'Аналитика 90 дней', 'Белый ярлык'] },
];

function cardStyle(): React.CSSProperties {
  return { background: '#FDFAF5', border: '0.5px solid var(--cream-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 24 };
}

export default function BillingPage() {
  const { showToast } = useToast();
  const [cancelling, setCancelling] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscription,
  });

  const sub = data?.subscription;
  const payments = data?.payments ?? [];

  const handleUpgrade = async (plan: string) => {
    try {
      const result = await upgradeSubscription(plan);
      window.location.href = result.payment_url;
    } catch {
      showToast('Ошибка: не удалось перейти к оплате', 'error');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Отменить подписку? Доступ сохранится до конца периода.')) return;
    setCancelling(true);
    try {
      await cancelSubscription();
      refetch();
      showToast('Подписка отменена', 'success');
    } catch {
      showToast('Ошибка: не удалось отменить', 'error');
    } finally {
      setCancelling(false);
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
  const trialTotal = 14;
  const trialProgress = Math.max(0, Math.min(100, (trialDays / trialTotal) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Current plan */}
      {sub && (
        <div style={cardStyle()}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink-primary)', marginBottom: 8 }}>
                {PLAN_LABEL[sub.plan] ?? sub.plan}
              </div>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 'var(--radius-sm)', fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 600, ...(STATUS_STYLE[sub.status] ?? {}) }}>
                {STATUS_LABEL[sub.status] ?? sub.status}
              </span>
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

          {sub.plan !== 'pro' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 8 }}>
              {UPGRADE_PLANS.filter((p) => {
                if (sub.plan === 'starter') return true;
                if (sub.plan === 'business') return p.plan === 'pro';
                return false;
              }).map((p) => (
                <div key={p.plan} style={{ border: '0.5px solid var(--cream-border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--ink-primary)', marginBottom: 4 }}>{p.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', fontFamily: 'var(--font-ui)', marginBottom: 10 }}>{p.price}</div>
                  <ul style={{ margin: '0 0 14px', padding: '0 0 0 16px', fontSize: 12, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', lineHeight: 1.8 }}>
                    {p.features.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                  <button onClick={() => handleUpgrade(p.plan)} style={{ width: '100%', padding: '8px', background: 'var(--ink-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>
                    Перейти на {p.label}
                  </button>
                </div>
              ))}
            </div>
          )}

          {sub.status === 'active' && (
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button onClick={handleCancel} disabled={cancelling} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', textDecoration: 'underline' }}>
                {cancelling ? 'Отмена...' : 'Отменить подписку'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Payment history */}
      <div style={cardStyle()}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink-primary)', marginBottom: 16 }}>История платежей</div>
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
                    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 600, ...(PAYMENT_STATUS_STYLE[p.status] ?? {}) }}>
                      {p.status === 'success' ? 'Оплачен' : p.status === 'pending' ? 'Ожидание' : 'Ошибка'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', color: 'var(--ink-secondary)' }}>{p.provider}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
