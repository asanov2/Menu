import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ConfirmModal, EmptyState, Skeleton, StatusBadge, SectionHeading, useToast, formatDate, getApiErrorMessage } from '@qrmenu/ui';
import {
  PLANS,
  getSubscription,
  getMenuUsage,
  upgradePlan,
  completeMockPayment,
  cancelSubscription,
  type Subscription,
  type UpgradeResult,
} from '../../api/billing';
import styles from './BillingPage.module.css';
import common from '../../styles/common.module.css';

const PLAN_ORDER = ['starter', 'business', 'pro'] as const;
const PLAN_NAMES: Record<string, string> = { starter: 'Старт', business: 'Бизнес', pro: 'Про' };

function getPlanButton(planId: string, sub: Subscription) {
  const subIdx = PLAN_ORDER.indexOf(sub.plan as typeof PLAN_ORDER[number]);
  const planIdx = PLAN_ORDER.indexOf(planId as typeof PLAN_ORDER[number]);
  const name = PLAN_NAMES[planId] ?? planId;

  if (sub.status === 'expired') {
    if (planIdx < subIdx) return { label: 'Недоступен', disabled: true, style: 'Disabled' as const };
    if (planIdx === subIdx) return { label: 'Продлить', disabled: false, style: 'Primary' as const };
    return { label: `Перейти на ${name}`, disabled: false, style: 'Primary' as const };
  }

  if (planId === sub.plan) return { label: 'Текущий план', disabled: true, style: 'Current' as const };
  if (planIdx < subIdx) return { label: 'Недоступен', disabled: true, style: 'Disabled' as const };
  return { label: `Перейти на ${name}`, disabled: false, style: 'Primary' as const };
}

export default function BillingPage() {
  const { showToast } = useToast();
  const qc = useQueryClient();

  const [upgradeTarget, setUpgradeTarget] = useState<string | null>(null);
  const [mockPaymentData, setMockPaymentData] = useState<UpgradeResult | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscription,
  });

  const { data: usage } = useQuery({
    queryKey: ['menuUsage'],
    queryFn: getMenuUsage,
  });

  const sub = data?.subscription;
  const payments = data?.payments ?? [];

  const handleConfirmUpgrade = async () => {
    if (!upgradeTarget) return;
    setIsUpgrading(true);
    setUpgradeTarget(null);
    try {
      const result = await upgradePlan(upgradeTarget);
      setMockPaymentData(result);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Не удалось создать платёж'), 'error');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      await completeMockPayment();
      setMockPaymentData(null);
      qc.invalidateQueries({ queryKey: ['subscription'] });
      qc.invalidateQueries({ queryKey: ['menuUsage'] });
      showToast('Оплата прошла успешно! Тариф обновлён.', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Ошибка при симуляции оплаты'), 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCancelAutoRenew = async () => {
    setIsCancelling(true);
    try {
      await cancelSubscription();
      qc.invalidateQueries({ queryKey: ['subscription'] });
      showToast('Автопродление отключено', 'success');
    } catch {
      showToast('Ошибка при отключении автопродления', 'error');
    } finally {
      setIsCancelling(false);
      setShowCancelModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className={common.skeletonStackMd}>
        <Skeleton height="160px" borderRadius="var(--radius-lg)" />
        <Skeleton height="260px" borderRadius="var(--radius-lg)" />
        <Skeleton height="120px" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  const targetPlan = PLANS.find(p => p.id === upgradeTarget);

  return (
    <div className={styles.page}>
      {/* Section 1: Current subscription status */}
      {sub && (
        <div className={common.card}>
          <div className={styles.statusHeader}>
            <div className={styles.statusLeft}>
              <div className={styles.statusPlanName}>{PLAN_NAMES[sub.plan] ?? sub.plan}</div>
              <StatusBadge status={sub.status as 'active' | 'trial' | 'expired' | 'cancelled'} />
            </div>
            <div className={styles.statusPeriod}>
              <div className={styles.periodLabel}>Активна до</div>
              <div className={styles.periodDate}>{formatDate(sub.current_period_end)}</div>
            </div>
          </div>

          {sub.status === 'trial' && (
            <div className={styles.trialInfo}>
              Пробный период: {sub.trial_remaining_days ?? 0} дн. осталось
            </div>
          )}

          {sub.status === 'expired' && (
            <div className={styles.expiredBanner}>
              Подписка истекла — оформите тариф для восстановления доступа
            </div>
          )}

          {usage && (
            <div className={styles.usageRow}>
              <div className={styles.usageItem}>
                <span className={styles.usageLabel}>Меню:</span>
                <span>
                  {usage.menus_used} из {usage.menus_limit ?? '∞'} использовано
                </span>
              </div>
              <div className={styles.usageItem}>
                <span className={styles.usageLabel}>Блюд:</span>
                <span>
                  {usage.items_used} из {usage.items_limit ?? '∞'} использовано
                </span>
              </div>
            </div>
          )}

          <div className={styles.autoRenewRow}>
            <span className={styles.autoRenewLabel}>Автопродление</span>
            <div
              className={`${styles.toggle} ${sub.auto_renew ? styles.toggleOn : styles.toggleOff}`}
              onClick={() => sub.auto_renew && setShowCancelModal(true)}
              role="switch"
              aria-checked={sub.auto_renew}
            />
          </div>
        </div>
      )}

      {/* Section 2: Plan cards */}
      {sub && (
        <div className={styles.plansGrid}>
          {PLANS.map(plan => {
            const btn = getPlanButton(plan.id, sub);
            return (
              <div
                key={plan.id}
                className={[
                  styles.planCard,
                  plan.id === sub.plan ? styles.planCardCurrent : '',
                  plan.isPopular ? styles.planCardPopular : '',
                ].join(' ')}
              >
                {plan.isPopular && <div className={styles.popularBadge}>Популярный</div>}
                <div className={styles.planCardHeader}>
                  <div className={styles.planName}>{plan.name}</div>
                  <div className={styles.planPrice}>
                    {plan.price.toLocaleString('ru-RU')} ₸
                    <span className={styles.planPricePeriod}>/мес</span>
                  </div>
                </div>
                <ul className={styles.planFeatures}>
                  {plan.features.map(f => (
                    <li key={f} className={styles.planFeatureItem}>
                      <span className={styles.checkmark}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`${styles.planBtn} ${styles[`planBtn${btn.style}`]}`}
                  disabled={btn.disabled || isUpgrading}
                  onClick={() => !btn.disabled && setUpgradeTarget(plan.id)}
                >
                  {isUpgrading && upgradeTarget === plan.id ? 'Загрузка...' : btn.label}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Section 3: White label teaser */}
      <div className={`${common.card} ${styles.whiteLabel}`}>
        <div>
          <div className={styles.whiteLabelTitle}>💎 White Label</div>
          <div className={styles.whiteLabelPrice}>от 150 000 ₸/мес</div>
          <div className={styles.whiteLabelDesc}>
            Полностью брендированное решение с вашим доменом, логотипом и кастомным дизайном меню
          </div>
        </div>
        <div className={styles.soonBadge}>Скоро</div>
      </div>

      {/* Section 4: Payment history */}
      <div className={common.card}>
        <SectionHeading>История платежей</SectionHeading>
        {payments.length === 0 ? (
          <EmptyState
            icon="💳"
            title="Нет платежей"
            description="История платежей появится после первой оплаты"
          />
        ) : (
          <table className={common.table}>
            <thead>
              <tr className={common.theadRow}>
                {['Дата', 'Сумма', 'План', 'Статус', 'Способ оплаты'].map(h => (
                  <th key={h} className={common.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className={common.tr}>
                  <td className={common.td}>{formatDate(p.created_at)}</td>
                  <td className={styles.tdAmount}>{Number(p.amount).toLocaleString('ru-RU')} ₸</td>
                  <td className={styles.tdPlan}>{p.target_plan ? (PLAN_NAMES[p.target_plan] ?? p.target_plan) : '—'}</td>
                  <td className={styles.tdStatus}>
                    <StatusBadge
                      status={p.status === 'success' ? 'online' : (p.status as 'failed' | 'pending')}
                      label={p.status === 'success' ? 'Оплачен' : p.status === 'pending' ? 'Ожидание' : 'Ошибка'}
                    />
                  </td>
                  <td className={styles.tdProvider}>{p.provider}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Upgrade confirm modal */}
      <ConfirmModal
        isOpen={!!upgradeTarget}
        title="Изменить тарифный план?"
        message={
          targetPlan
            ? `Переход на план «${targetPlan.name}» — ${targetPlan.price.toLocaleString('ru-RU')} ₸/мес. Продолжить?`
            : ''
        }
        confirmText="Продолжить к оплате"
        cancelText="Отмена"
        danger={false}
        onConfirm={handleConfirmUpgrade}
        onCancel={() => setUpgradeTarget(null)}
      />

      {/* Mock payment modal */}
      <ConfirmModal
        isOpen={!!mockPaymentData}
        title="Тестовая оплата"
        message={
          mockPaymentData
            ? `В реальном режиме здесь откроется Kaspi Pay.\nСумма: ${mockPaymentData.amount.toLocaleString('ru-RU')} ₸ · план: ${PLAN_NAMES[mockPaymentData.plan] ?? mockPaymentData.plan}.\n\nНажмите кнопку ниже для симуляции оплаты.`
            : ''
        }
        confirmText={isSimulating ? 'Обработка...' : 'Симулировать оплату'}
        cancelText="Отмена"
        danger={false}
        onConfirm={handleSimulate}
        onCancel={() => setMockPaymentData(null)}
      />

      {/* Cancel auto-renew confirm modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Отключить автопродление?"
        message="После окончания текущего периода подписка не продлится автоматически."
        confirmText={isCancelling ? 'Отключение...' : 'Отключить'}
        cancelText="Отмена"
        danger
        onConfirm={handleCancelAutoRenew}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
}
