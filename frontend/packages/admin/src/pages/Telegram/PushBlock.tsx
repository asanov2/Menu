import { useEffect, useState } from 'react';
import { Icon, useToast, getApiErrorMessage } from '@qrmenu/ui';
import { getPushStatus, subscribeToPush, unsubscribeFromPush, type PushStatus } from '@qrmenu/ui';
import { getVapidPublicKey, subscribePush, unsubscribePush } from '../../api/push';
import common from '../../styles/common.module.css';
import styles from './PushBlock.module.css';

function getDeviceLabel(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS / Safari';
  if (/Android/.test(ua)) return `Android / ${/Chrome/.test(ua) ? 'Chrome' : 'Browser'}`;
  const b = /Edg/.test(ua) ? 'Edge' : /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Browser';
  return `Desktop / ${b}`;
}

function isIosNotStandalone(): boolean {
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) &&
    !(navigator as Navigator & { standalone?: boolean }).standalone
  );
}

export default function PushBlock() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<PushStatus>('unsupported');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPushStatus().then(setStatus);
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const vapidKey = await getVapidPublicKey();
      const sub = await subscribeToPush(vapidKey);
      if (!sub) {
        setStatus(await getPushStatus());
        return;
      }
      await subscribePush(sub, getDeviceLabel());
      setStatus('subscribed');
      showToast('Push-уведомления включены на этом устройстве', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const endpoint = await unsubscribeFromPush();
      if (endpoint) {
        try { await unsubscribePush(endpoint); } catch { /* subscription already gone from server */ }
      }
      setStatus('default');
      showToast('Push-уведомления отключены на этом устройстве', 'success');
    } catch {
      showToast('Не удалось отключить уведомления', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={common.card}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <Icon name="bell" size={16} />
        </div>
        <span className={styles.title}>Push-уведомления</span>
      </div>

      <div className={styles.statusRow}>
        <span
          className={[
            styles.dot,
            status === 'subscribed' ? styles.dotActive : '',
            status === 'denied' ? styles.dotDenied : '',
          ].join(' ')}
        />
        <span className={styles.statusText}>
          {status === 'subscribed' && 'Включены на этом устройстве'}
          {status === 'default' && 'Выключены'}
          {status === 'denied' && 'Заблокированы в браузере'}
          {status === 'unsupported' && 'Браузер не поддерживает Web Push'}
        </span>
      </div>

      {status === 'denied' && (
        <div className={styles.hintBox}>
          <Icon name="info-circle" size={14} />
          <span>Откройте настройки браузера → Уведомления и разрешите для этого сайта</span>
        </div>
      )}

      {isIosNotStandalone() && status !== 'subscribed' && status !== 'unsupported' && (
        <div className={styles.hintBox}>
          <Icon name="info-circle" size={14} />
          <span>
            На iPhone push работают только после установки: нажмите <strong>Поделиться</strong>{' '}
            → <strong>На экран Домой</strong>
          </span>
        </div>
      )}

      {status === 'default' && (
        <button className={styles.btnEnable} onClick={handleSubscribe} disabled={loading}>
          <Icon name="bell" size={16} />
          {loading ? 'Подключение...' : 'Разрешить уведомления'}
        </button>
      )}

      {status === 'subscribed' && (
        <button className={styles.btnDisable} onClick={handleUnsubscribe} disabled={loading}>
          <Icon name="bell-off" size={16} />
          {loading ? 'Отключение...' : 'Отключить на этом устройстве'}
        </button>
      )}

      <div className={styles.footer}>
        Разрешение действует только на этом устройстве и браузере. На другом устройстве нужно включить отдельно.
      </div>
    </div>
  );
}
