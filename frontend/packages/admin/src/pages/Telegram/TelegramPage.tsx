import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SectionHeading, Icon, useToast, getApiErrorMessage } from '@qrmenu/ui';
import AdminLayout from '../../layout/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import {
  getTelegramStatus,
  generateTelegramCode,
  saveTelegramSettings,
  disconnectTelegram,
  type TelegramStatus,
} from '../../api/telegram';
import styles from './TelegramPage.module.css';
import common from '../../styles/common.module.css';

function CountdownTimer({ expiresIn, onExpire }: { expiresIn: number; onExpire: () => void }) {
  const [seconds, setSeconds] = useState(expiresIn);

  useEffect(() => {
    if (seconds <= 0) { onExpire(); return; }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds, onExpire]);

  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return <span className={styles.timer}>{m}:{s}</span>;
}

function formatCode(code: string) {
  return code.slice(0, 3) + ' ' + code.slice(3);
}

export default function TelegramPage() {
  const { restaurant } = useAuth();
  const { showToast } = useToast();
  const qc = useQueryClient();

  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeExpiresIn, setCodeExpiresIn] = useState(0);
  const [localSettings, setLocalSettings] = useState({
    orders_enabled: false,
    preorders_enabled: false,
    tables_count: 10,
  });

  const { data: status, isLoading } = useQuery<TelegramStatus>({
    queryKey: ['telegram-status'],
    queryFn: getTelegramStatus,
  });

  useEffect(() => {
    if (status) {
      setLocalSettings({
        orders_enabled: status.orders_enabled,
        preorders_enabled: status.preorders_enabled,
        tables_count: status.tables_count,
      });
    }
  }, [status]);

  const generateMutation = useMutation({
    mutationFn: generateTelegramCode,
    onSuccess: (data) => {
      setGeneratedCode(data.code);
      setCodeExpiresIn(data.expires_in);
    },
    onError: (err) => showToast(getApiErrorMessage(err), 'error'),
  });

  const settingsMutation = useMutation({
    mutationFn: saveTelegramSettings,
    onSuccess: () => {
      showToast('Настройки сохранены', 'success');
      qc.invalidateQueries({ queryKey: ['telegram-status'] });
    },
    onError: (err) => showToast(getApiErrorMessage(err), 'error'),
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectTelegram,
    onSuccess: () => {
      showToast('Telegram отключён', 'success');
      setGeneratedCode(null);
      qc.invalidateQueries({ queryKey: ['telegram-status'] });
    },
    onError: (err) => showToast(getApiErrorMessage(err), 'error'),
  });

  const isPro = restaurant?.plan === 'pro';
  const isBusiness = restaurant?.plan === 'business' || isPro;
  const connected = status?.connected ?? false;

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={common.pageHeader}>
          <h1 className={common.pageTitle}>Telegram</h1>
        </div>

        {isLoading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : (
          <div className={styles.blocks}>
            {/* Block 1 — Connection */}
            <div className={common.card}>
              <SectionHeading>Подключение</SectionHeading>

              {connected ? (
                <div className={styles.connectedRow}>
                  <div className={styles.connectedBadge}>
                    <Icon name="circle-check-filled" size={18} />
                    <span>Подключено</span>
                  </div>
                  <button
                    className={common.btnSecondary}
                    onClick={() => disconnectMutation.mutate()}
                    disabled={disconnectMutation.isPending}
                  >
                    Отключить
                  </button>
                </div>
              ) : generatedCode ? (
                <div className={styles.codeBlock}>
                  <div className={styles.codeLabel}>Ваш код подключения</div>
                  <div className={styles.codeDisplay}>{formatCode(generatedCode)}</div>
                  <div className={styles.codeInstruction}>
                    Найдите <strong>@{status?.bot_username ?? 'qrmenuskz_bot'}</strong> в Telegram и введите этот код
                  </div>
                  <div className={styles.timerRow}>
                    Код действителен:&nbsp;
                    <CountdownTimer
                      expiresIn={codeExpiresIn}
                      onExpire={() => setGeneratedCode(null)}
                    />
                  </div>
                  <div className={styles.codeActions}>
                    <button
                      className={common.btnSecondary}
                      onClick={() => qc.invalidateQueries({ queryKey: ['telegram-status'] })}
                    >
                      Обновить статус
                    </button>
                    <button
                      className={common.btnSecondary}
                      onClick={() => generateMutation.mutate()}
                      disabled={generateMutation.isPending}
                    >
                      Новый код
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.notConnected}>
                  <div className={styles.notConnectedText}>
                    Подключите Telegram-бота, чтобы получать уведомления о заказах
                  </div>
                  <button
                    className={common.btnPrimary}
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                  >
                    {generateMutation.isPending ? 'Генерация...' : 'Сгенерировать код'}
                  </button>
                </div>
              )}
            </div>

            {/* Block 2 — Order settings (business/pro only, and connected) */}
            {connected && isBusiness && (
              <div className={common.card}>
                <SectionHeading>Настройки заказов</SectionHeading>

                <div className={styles.settingsForm}>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={localSettings.orders_enabled}
                      onChange={(e) =>
                        setLocalSettings((s) => ({ ...s, orders_enabled: e.target.checked }))
                      }
                    />
                    <span className={styles.toggleLabel}>Заказ за столом</span>
                  </label>

                  {localSettings.orders_enabled && (
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Количество столов</label>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={localSettings.tables_count}
                        onChange={(e) =>
                          setLocalSettings((s) => ({
                            ...s,
                            tables_count: Math.max(1, parseInt(e.target.value) || 1),
                          }))
                        }
                        className={styles.numInput}
                      />
                    </div>
                  )}

                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={localSettings.preorders_enabled}
                      onChange={(e) =>
                        setLocalSettings((s) => ({ ...s, preorders_enabled: e.target.checked }))
                      }
                    />
                    <span className={styles.toggleLabel}>Предзаказ</span>
                  </label>

                  <button
                    className={common.btnPrimary}
                    style={{ marginTop: 8, alignSelf: 'flex-start' }}
                    onClick={() => settingsMutation.mutate(localSettings)}
                    disabled={settingsMutation.isPending}
                  >
                    {settingsMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </div>
            )}

            {/* Block 3 — Pro info */}
            {isPro && (
              <div className={common.card}>
                <SectionHeading>Аналитика</SectionHeading>
                <div className={styles.infoText}>
                  <Icon name="clock" size={16} />
                  Ежедневная сводка приходит в 09:00 по времени Алматы
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
