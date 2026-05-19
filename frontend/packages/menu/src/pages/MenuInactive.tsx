import { useTranslation } from 'react-i18next';
import common from '../styles/common.module.css';
import styles from './MenuInactive.module.css';

interface MenuInactiveProps {
  restaurantName?: string;
}

export default function MenuInactive({ restaurantName }: MenuInactiveProps) {
  const { t } = useTranslation();

  return (
    <div className={common.errorPage}>
      <i className="ti ti-barrier-block" style={{ fontSize: 64 }} />

      {restaurantName && (
        <div className={styles.restaurantName}>{restaurantName}</div>
      )}

      <div className={styles.title}>{t('errors.menuInactiveTitle')}</div>
      <div className={styles.desc}>{t('errors.menuInactiveDesc')}</div>
    </div>
  );
}
