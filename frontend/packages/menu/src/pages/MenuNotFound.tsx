import { useTranslation } from 'react-i18next';
import common from '../styles/common.module.css';
import styles from './MenuNotFound.module.css';

export default function MenuNotFound() {
  const { t } = useTranslation();

  return (
    <div className={common.errorPage}>
      <i className="ti ti-tools-kitchen-2" style={{ fontSize: 64 }} />
      <div className={styles.title}>{t('errors.menuNotFoundTitle')}</div>
      <div className={styles.desc}>{t('errors.menuNotFoundDesc')}</div>
    </div>
  );
}
