import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { PlanLimitDetail } from '../utils/planLimitError'
import { PLAN_NAMES, PLAN_PRICES } from '../utils/planLimitError'
import { Icon } from '@qrmenu/ui'
import { useAuth } from '../hooks/useAuth'
import styles from './PlanLimitModal.module.css'

interface Props {
  detail: PlanLimitDetail | null
  onClose: () => void
}

const PLAN_FEATURES: Record<string, string[]> = {
  business: [
    'Перевод меню AI',
    'КБЖУ помощник AI',
    'Заказы и предзаказы за столом',
    'До 5 меню и 200 блюд',
  ],
  pro: [
    'Генерация описаний AI',
    'Аллергены с фильтрацией',
    'Telegram сводка аналитики',
    'Безлимитные меню и блюда',
  ],
}

const SPRING = { type: 'spring' as const, damping: 28, stiffness: 320 }
const FADE = { duration: 0.18 }

export default function PlanLimitModal({ detail, onClose }: Props) {
  const navigate = useNavigate()
  const { restaurant } = useAuth()

  const currentPlan = restaurant?.plan ?? 'starter'
  const currentName = PLAN_NAMES[currentPlan] ?? currentPlan
  const upgradeName = detail ? (PLAN_NAMES[detail.upgrade_to] ?? detail.upgrade_to) : ''
  const upgradePrice = detail ? PLAN_PRICES[detail.upgrade_to] : undefined
  const features = detail ? (PLAN_FEATURES[detail.upgrade_to] ?? []) : []

  return createPortal(
    <AnimatePresence>
      {detail && (
        <>
          <motion.div
            key="plm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
            className={styles.backdrop}
            onClick={onClose}
          />

          <motion.div
            key="plm-panel"
            initial={{ opacity: 0, scale: 0.94, x: '-50%', y: 'calc(-50% - 12px)' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.94, x: '-50%', y: 'calc(-50% - 12px)' }}
            transition={SPRING}
            className={styles.panel}
          >
            {/* Lock icon circle */}
            <div className={styles.lockWrap}>
              <Icon name="lock" size={32} className={styles.lockIcon} />
            </div>

            {/* Header text */}
            <h2 className={styles.title}>Функция недоступна</h2>
            <p className={styles.message}>{detail.message}</p>

            {/* Plan comparison */}
            <div className={styles.planRow}>
              <div className={styles.planCard}>
                <div className={styles.planCardLabel}>Ваш тариф</div>
                <div className={styles.planCardName}>{currentName}</div>
              </div>

              <div className={styles.arrowWrap}>
                <Icon name="arrow-right" size={16} className={styles.arrowIcon} />
              </div>

              <div className={`${styles.planCard} ${styles.planCardUpgrade}`}>
                <div className={styles.planCardLabelGold}>Нужен тариф</div>
                <div className={styles.planCardName}>{upgradeName}</div>
                {upgradePrice && (
                  <div className={styles.planCardPrice}>
                    {upgradePrice.toLocaleString('ru-RU')} ₸/мес
                  </div>
                )}
              </div>
            </div>

            {/* Feature list */}
            {features.length > 0 && (
              <ul className={styles.features}>
                {features.map((f) => (
                  <li key={f} className={styles.featureRow}>
                    <Icon name="check" size={14} className={styles.featureCheck} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Actions */}
            <div className={styles.actions}>
              <button
                className={styles.btnUpgrade}
                onClick={() => { navigate('/billing'); onClose(); }}
              >
                <Icon name="crown" size={16} />
                Перейти к тарифам
              </button>
              <button className={styles.btnClose} onClick={onClose}>
                Закрыть
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
