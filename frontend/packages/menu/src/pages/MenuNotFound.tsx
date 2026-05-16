import { useTranslation } from 'react-i18next';
import common from '../styles/common.module.css';
import styles from './MenuNotFound.module.css';

export default function MenuNotFound() {
  const { t } = useTranslation();

  return (
    <div className={common.errorPage}>
      <span className={styles.emoji}>🍽️</span>
      <div className={styles.title}>{t('errors.menuNotFoundTitle')}</div>
      <div className={styles.desc}>{t('errors.menuNotFoundDesc')}</div>
    </div>
  );
}
