import common from '../styles/common.module.css';
import styles from './MenuInactive.module.css';

export default function MenuExpired() {
  return (
    <div className={common.errorPage}>
      <i className="ti ti-clock-pause" style={{ fontSize: 64, color: 'var(--accent-gold)', marginBottom: 20 }} />
      <div className={styles.title}>Меню временно недоступно</div>
      <div className={styles.desc}>
        Ресторан обновляет условия работы сервиса.
        Пожалуйста, попробуйте позже или обратитесь к персоналу.
      </div>
    </div>
  );
}
