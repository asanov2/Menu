import { useNavigate } from 'react-router-dom';
import styles from './SubscriptionExpiredScreen.module.css';

export default function SubscriptionExpiredScreen() {
  const navigate = useNavigate();

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <i className={`ti ti-clock-pause ${styles.icon}`} />
        <h2 className={styles.title}>Пробный период завершён</h2>
        <p className={styles.desc}>
          Ваш бесплатный период закончился. Выберите тариф, чтобы продолжить
          пользоваться всеми функциями сервиса.
        </p>
        <button className={styles.btn} onClick={() => navigate('/billing')}>
          Выбрать тариф
        </button>
      </div>
    </div>
  );
}
