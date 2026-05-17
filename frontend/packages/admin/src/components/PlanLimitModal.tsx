import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import type { PlanLimitDetail } from '../utils/planLimitError'
import { PLAN_NAMES, PLAN_PRICES } from '../utils/planLimitError'
import styles from './PlanLimitModal.module.css'

interface Props {
  detail: PlanLimitDetail | null
  onClose: () => void
}

export default function PlanLimitModal({ detail, onClose }: Props) {
  const navigate = useNavigate()

  if (!detail) return null

  const upgradeName = PLAN_NAMES[detail.upgrade_to] ?? detail.upgrade_to
  const upgradePrice = PLAN_PRICES[detail.upgrade_to]

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.lockIcon}>🔒</div>
        <h2 className={styles.title}>Лимит тарифа</h2>
        <p className={styles.message}>{detail.message}</p>

        <div className={styles.upgradeBox}>
          <div className={styles.upgradeLabel}>Следующий тариф</div>
          <div className={styles.upgradeName}>{upgradeName}</div>
          {upgradePrice && (
            <div className={styles.upgradePrice}>
              {upgradePrice.toLocaleString('ru-RU')} ₸/мес
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.btnUpgrade}
            onClick={() => { navigate('/billing'); onClose(); }}
          >
            Перейти к тарифам
          </button>
          <button className={styles.btnClose} onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
