import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon, useToast, getApiErrorMessage } from '@qrmenu/ui';
import { useAuth } from '../../hooks/useAuth';
import {
  getTelegramStatus,
  generateTelegramCode,
  deleteRecipient,
  type TelegramRecipient,
  type GenerateCodeResult,
} from '../../api/telegram';
import styles from './TelegramPage.module.css';
import common from '../../styles/common.module.css';

// ── Countdown timer ───────────────────────────────────────────────────────────

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

// ── Recipient row ─────────────────────────────────────────────────────────────

function RecipientRow({
  recipient,
  onDelete,
  isDeleting,
}: {
  recipient: TelegramRecipient;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  return (
    <div className={styles.recipientRow}>
      <div className={styles.recipientIcon}>
        <Icon name="brand-telegram" size={15} />
      </div>
      <span className={styles.recipientLabel}>{recipient.label}</span>
      <button
        className={styles.recipientDeleteBtn}
        onClick={() => onDelete(recipient.id)}
        disabled={isDeleting}
        title="Отвязать"
      >
        <Icon name="trash" size={14} />
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Mode = 'list' | 'add-form' | 'code-shown';

export default function TelegramPage() {
  const { restaurant } = useAuth();
  const { showToast } = useToast();
  const qc = useQueryClient();

  const [mode, setMode] = useState<Mode>('list');
  const [pendingLabel, setPendingLabel] = useState('');
  const [codeData, setCodeData] = useState<GenerateCodeResult | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

  const { data: status, isLoading } = useQuery({
    queryKey: ['telegram-status'],
    queryFn: getTelegramStatus,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const isPro = restaurant?.plan === 'pro';
  const recipients = status?.recipients ?? [];
  const botUsername = status?.bot_username ?? 'qrmenuskz_bot';

  // Focus label input when switching to add-form
  useEffect(() => {
    if (mode === 'add-form') {
      setTimeout(() => labelInputRef.current?.focus(), 50);
    }
  }, [mode]);

  const handleExpire = useCallback(() => {
    setCodeData(null);
    setMode('list');
    showToast('Код истёк. Сгенерируйте новый.', 'error');
  }, [showToast]);

  const generateMutation = useMutation({
    mutationFn: () => generateTelegramCode(pendingLabel.trim()),
    onSuccess: (data) => {
      setCodeData(data);
      setMode('code-shown');
    },
    onError: (err) => showToast(getApiErrorMessage(err), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRecipient(id),
    onSuccess: () => {
      showToast('Получатель отвязан', 'success');
      qc.invalidateQueries({ queryKey: ['telegram-status'] });
    },
    onError: (err) => showToast(getApiErrorMessage(err), 'error'),
    onSettled: () => setDeletingId(null),
  });

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteMutation.mutate(id);
  };

  const handleCheckStatus = () => {
    qc.invalidateQueries({ queryKey: ['telegram-status'] });
  };

  // Close add form if a new recipient appeared after generating a code
  const prevRecipientsCount = useRef(recipients.length);
  useEffect(() => {
    if (mode === 'code-shown' && recipients.length > prevRecipientsCount.current) {
      setMode('list');
      setCodeData(null);
      setPendingLabel('');
      showToast('Получатель успешно добавлен!', 'success');
    }
    prevRecipientsCount.current = recipients.length;
  }, [recipients.length, mode, showToast]);

  const cancelAddForm = () => {
    setMode('list');
    setCodeData(null);
    setPendingLabel('');
  };

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

          {/* ─── Блок 1: Получатели ─── */}
          <div className={common.card}>
            <div className={styles.blockHeader}>
              <Icon name="brand-telegram" size={16} />
              <span className={styles.blockTitle}>Получатели уведомлений</span>
              {recipients.length > 0 && (
                <span className={styles.recipientsCount}>{recipients.length}</span>
              )}
            </div>

            {/* Список получателей */}
            {recipients.length > 0 && mode !== 'add-form' && mode !== 'code-shown' && (
              <div className={styles.recipientsList}>
                {recipients.map((r) => (
                  <RecipientRow
                    key={r.id}
                    recipient={r}
                    onDelete={handleDelete}
                    isDeleting={deletingId === r.id}
                  />
                ))}
              </div>
            )}

            {/* Пустое состояние */}
            {recipients.length === 0 && mode === 'list' && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Icon name="brand-telegram" size={36} />
                </div>
                <div className={styles.emptyTitle}>Нет привязанных получателей</div>
                <div className={styles.emptyDesc}>
                  Добавьте первого, чтобы получать уведомления о новых заказах
                </div>
              </div>
            )}

            {/* Форма добавления: ввод подписи */}
            {mode === 'add-form' && (
              <div className={styles.addForm}>
                <label className={styles.addFormLabel}>
                  Имя и должность получателя
                </label>
                <input
                  ref={labelInputRef}
                  className={styles.addFormInput}
                  type="text"
                  placeholder="Напр.: Азамат — официант"
                  value={pendingLabel}
                  onChange={(e) => setPendingLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && pendingLabel.trim()) {
                      generateMutation.mutate();
                    }
                  }}
                  maxLength={100}
                />
                <div className={styles.addFormHint}>
                  Эта подпись будет отображаться в списке получателей
                </div>
                <div className={styles.addFormActions}>
                  <button
                    className={styles.btnGenerate}
                    onClick={() => generateMutation.mutate()}
                    disabled={!pendingLabel.trim() || generateMutation.isPending}
                  >
                    <Icon name="qrcode" size={16} />
                    {generateMutation.isPending ? 'Генерация...' : 'Сгенерировать код'}
                  </button>
                  <button className={styles.btnCancel} onClick={cancelAddForm}>
                    Отмена
                  </button>
                </div>
              </div>
            )}

            {/* Показ кода и инструкция */}
            {mode === 'code-shown' && codeData && (
              <div className={styles.codeState}>
                <div className={styles.codeSectionLabel}>Код подключения</div>
                <div className={styles.codeDisplay}>{formatCode(codeData.code)}</div>

                <div className={styles.timerRow}>
                  <Icon name="clock" size={14} />
                  <span>Код действителен ещё</span>
                  <CountdownTimer expiresIn={codeData.expires_in} onExpire={handleExpire} />
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
                  <button className={styles.btnOutline} onClick={handleCheckStatus}>
                    <Icon name="refresh" size={14} />
                    Проверить подключение
                  </button>
                  <button className={styles.btnGhost} onClick={cancelAddForm}>
                    Закрыть
                  </button>
                </div>
              </div>
            )}

            {/* Кнопка «Добавить получателя» */}
            {mode === 'list' && (
              <div className={styles.addBtnWrap}>
                <button
                  className={styles.btnAddRecipient}
                  onClick={() => setMode('add-form')}
                >
                  <Icon name="plus" size={16} />
                  Добавить получателя
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
