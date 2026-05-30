import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon, useToast, getApiErrorMessage } from '@qrmenu/ui';
import { useAuth } from '../../hooks/useAuth';
import {
  getTelegramStatus,
  generateTelegramCode,
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
  return <span className={styles.timerValue}>{m}:{s}</span>;
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

  const { data: status, isLoading } = useQuery<TelegramStatus>({
    queryKey: ['telegram-status'],
    queryFn: getTelegramStatus,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const handleExpire = useCallback(() => setGeneratedCode(null), []);

  const generateMutation = useMutation({
    mutationFn: generateTelegramCode,
    onSuccess: (data) => {
      setGeneratedCode(data.code);
      setCodeExpiresIn(data.expires_in);
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
  const connected = status?.connected ?? false;
  const botUsername = status?.bot_username ?? 'qrmenuskz_bot';

  return (
    <div className={styles.page}>
        <div className={common.pageHeader}>
          <div className={styles.titleRow}>
            <div className={styles.titleIconWrap}>
              <Icon name="brand-telegram" size={20} />
            </div>
            <h1 className={common.pageTitle}>Telegram</h1>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.skeletons}>
            <div className={styles.skeletonCard} />
            <div className={`${styles.skeletonCard} ${styles.skeletonCardShort}`} />
          </div>
        ) : (
          <div className={styles.blocks}>

            {/* ─── Блок 1: Подключение ─── */}
            <div className={common.card}>
              {connected ? (
                <div className={styles.connectedState}>
                  <div className={styles.connectedIconWrap}>
                    <Icon name="circle-check" size={32} />
                  </div>
                  <div className={styles.connectedText}>
                    <div className={styles.connectedTitle}>Telegram подключён</div>
                    <div className={styles.connectedDesc}>Уведомления будут приходить в ваш аккаунт</div>
                  </div>
                  <button
                    className={styles.disconnectBtn}
                    onClick={() => disconnectMutation.mutate()}
                    disabled={disconnectMutation.isPending}
                  >
                    <Icon name="unlink" size={14} />
                    Отключить
                  </button>
                </div>

              ) : generatedCode ? (
                <div className={styles.codeState}>
                  <div className={styles.codeSectionLabel}>Код подключения</div>
                  <div className={styles.codeDisplay}>{formatCode(generatedCode)}</div>

                  <div className={styles.timerRow}>
                    <Icon name="clock" size={14} />
                    <span>Код действителен ещё</span>
                    <CountdownTimer expiresIn={codeExpiresIn} onExpire={handleExpire} />
                  </div>

                  <div className={styles.steps}>
                    <div className={styles.step}>
                      <span className={styles.stepNum}>1</span>
                      <Icon name="brand-telegram" size={15} />
                      <span>Найдите <strong>@{botUsername}</strong> в Telegram</span>
                    </div>
                    <div className={styles.step}>
                      <span className={styles.stepNum}>2</span>
                      <Icon name="terminal-2" size={15} />
                      <span>Нажмите /start</span>
                    </div>
                    <div className={styles.step}>
                      <span className={styles.stepNum}>3</span>
                      <Icon name="keyboard" size={15} />
                      <span>Введите этот код</span>
                    </div>
                  </div>

                  <div className={styles.codeActions}>
                    <button
                      className={styles.btnOutline}
                      onClick={() => qc.invalidateQueries({ queryKey: ['telegram-status'] })}
                    >
                      <Icon name="refresh" size={14} />
                      Обновить статус
                    </button>
                    <button
                      className={styles.btnGhost}
                      onClick={() => generateMutation.mutate()}
                      disabled={generateMutation.isPending}
                    >
                      Сгенерировать новый код
                    </button>
                  </div>
                </div>

              ) : (
                <div className={styles.notConnectedState}>
                  <div className={styles.tgIconWrap}>
                    <Icon name="brand-telegram" size={48} />
                  </div>
                  <div className={styles.notConnectedTitle}>Подключите Telegram-бот</div>
                  <div className={styles.notConnectedDesc}>
                    Получайте уведомления о заказах прямо в Telegram
                  </div>
                  <button
                    className={styles.btnGenerate}
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                  >
                    <Icon name="refresh" size={16} />
                    {generateMutation.isPending ? 'Генерация...' : 'Сгенерировать код'}
                  </button>
                </div>
              )}
            </div>

            {/* ─── Блок 2: Ежедневная сводка (только Pro) ─── */}
            {isPro && (
              <div className={`${common.card} ${styles.proCard}`}>
                <div className={styles.proBadge}>Про</div>
                <div className={styles.proIconWrap}>
                  <Icon name="chart-bar" size={32} />
                </div>
                <div className={styles.proTitle}>Ежедневная сводка</div>
                <div className={styles.proDesc}>
                  Каждый день в 09:00 по времени Алматы вы будете получать в Telegram сводку:
                  просмотры меню, топ блюда, пиковое время.
                </div>
              </div>
            )}

          </div>
        )}
      </div>
  );
}
