import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmptyState, Icon } from '@qrmenu/ui';
import { getWaiterCalls, updateWaiterCallStatus, type WaiterCall } from '../../api/waiterCalls';
import styles from './OrdersPage.module.css';

// ── Timezone helpers (Asia/Almaty = UTC+5) ──────────────────────────────────

const ALMATY_OFFSET = 5 * 60;

function toAlmatyDate(isoStr: string): Date {
  const utc = new Date(isoStr);
  return new Date(utc.getTime() + ALMATY_OFFSET * 60_000);
}

function formatDateLabel(isoStr: string): string {
  const local = toAlmatyDate(isoStr);
  const now = toAlmatyDate(new Date().toISOString());
  const localDay = local.toISOString().slice(0, 10);
  const todayDay = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);
  if (localDay === todayDay) return 'Сегодня';
  if (localDay === yesterday) return 'Вчера';
  return local.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

function formatTime(isoStr: string): string {
  const local = toAlmatyDate(isoStr);
  return local.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function groupByDate(calls: WaiterCall[]): { label: string; calls: WaiterCall[] }[] {
  const groups: { label: string; calls: WaiterCall[] }[] = [];
  const seen = new Map<string, number>();
  for (const call of calls) {
    const dateKey = toAlmatyDate(call.created_at).toISOString().slice(0, 10);
    const label = formatDateLabel(call.created_at);
    if (!seen.has(dateKey)) {
      seen.set(dateKey, groups.length);
      groups.push({ label, calls: [] });
    }
    groups[seen.get(dateKey)!].calls.push(call);
  }
  return groups;
}

// ── Sound ────────────────────────────────────────────────────────────────────

function playBeep(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(660, ctx.currentTime);
  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.45);
}

// ── Call Card ────────────────────────────────────────────────────────────────

interface CallCardProps {
  call: WaiterCall;
  onStatusChange: (id: string, status: 'new' | 'done') => void;
  isPending: boolean;
}

function CallCard({ call, onStatusChange, isPending }: CallCardProps) {
  const isNew = call.status === 'new';
  return (
    <div className={`${styles.card} ${isNew ? styles.cardNew : styles.cardDone}`}>
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <div className={`${styles.cardTitle} ${!isNew ? styles.cardTitleDone : ''}`}>
            Стол №{call.table_number}
          </div>
          <span className={`${styles.badge} ${styles.badgeTable}`}>
            <Icon name="bell-ringing" size={11} />
            Вызов
          </span>
          {isNew && (
            <span className={`${styles.badge} ${styles.badgeNew}`}>
              <Icon name="bell-ringing" size={11} />
              Новый
            </span>
          )}
        </div>
        <div className={styles.cardMeta}>
          <span>{formatTime(call.created_at)}</span>
          <span className={styles.metaDivider} />
          <Icon name="tools-kitchen-2" size={12} />
          <span>{call.menu_name}</span>
        </div>
      </div>
      <div className={styles.cardFooter}>
        {isNew ? (
          <button
            className={styles.btnDone}
            disabled={isPending}
            onClick={() => onStatusChange(call.id, 'done')}
          >
            <Icon name="check" size={14} />
            Принято
          </button>
        ) : (
          <button
            className={styles.btnUndo}
            disabled={isPending}
            onClick={() => onStatusChange(call.id, 'new')}
          >
            <Icon name="rotate-left" size={14} />
            Вернуть в новые
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function WaiterCallsPage() {
  const queryClient = useQueryClient();

  const audioCtxRef = useRef<AudioContext | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem('orders_sound_enabled') === 'true',
  );
  const [showSoundBanner, setShowSoundBanner] = useState(
    () => localStorage.getItem('orders_sound_enabled') !== 'true',
  );

  const knownIdsRef = useRef<Set<string> | null>(null);

  const [olderCalls, setOlderCalls] = useState<WaiterCall[]>([]);
  const [canLoadMore, setCanLoadMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-waiter-calls'],
    queryFn: () => getWaiterCalls(),
    refetchInterval: 8_000,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

  const recentCalls = data?.calls ?? [];

  useEffect(() => {
    if (!data) return;
    const ids = new Set(data.calls.map((c) => c.id));
    if (knownIdsRef.current === null) {
      knownIdsRef.current = ids;
      return;
    }
    const hasNew = data.calls.some((c) => !knownIdsRef.current!.has(c.id));
    knownIdsRef.current = ids;
    if (hasNew && soundEnabled && audioCtxRef.current) {
      playBeep(audioCtxRef.current);
    }
  }, [data, soundEnabled]);

  useEffect(() => {
    if (localStorage.getItem('orders_sound_enabled') !== 'true') return;
    const wakeUp = () => {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      audioCtxRef.current.resume().catch(() => {});
      document.removeEventListener('click', wakeUp);
    };
    document.addEventListener('click', wakeUp);
    return () => document.removeEventListener('click', wakeUp);
  }, []);

  const enableSound = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    localStorage.setItem('orders_sound_enabled', 'true');
    setSoundEnabled(true);
    setShowSoundBanner(false);
    playBeep(audioCtxRef.current);
  }, []);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'new' | 'done' }) =>
      updateWaiterCallStatus(id, status),
    onSuccess: (updated) => {
      queryClient.setQueryData<{ calls: WaiterCall[]; has_more: boolean }>(
        ['admin-waiter-calls'],
        (old) => {
          if (!old) return old;
          return { ...old, calls: old.calls.map((c) => (c.id === updated.id ? updated : c)) };
        },
      );
      setOlderCalls((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    },
  });

  const handleLoadOlder = async () => {
    const all = [...recentCalls, ...olderCalls];
    if (all.length === 0) return;
    const oldest = all.reduce((a, b) =>
      new Date(a.created_at) < new Date(b.created_at) ? a : b,
    );
    setLoadingOlder(true);
    try {
      const result = await getWaiterCalls({ before: oldest.created_at, load_older: true });
      setOlderCalls((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        return [...prev, ...result.calls.filter((c) => !existingIds.has(c.id))];
      });
      setCanLoadMore(result.has_more);
    } finally {
      setLoadingOlder(false);
    }
  };

  useEffect(() => {
    if (data) setCanLoadMore(data.has_more);
  }, [data]);

  const allCalls = [...recentCalls, ...olderCalls].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const uniqueCalls = allCalls.filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i);
  const groups = groupByDate(uniqueCalls);
  const newCount = uniqueCalls.filter((c) => c.status === 'new').length;

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonList}>
          {[1, 2, 3].map((i) => <div key={i} className={styles.skeletonCard} />)}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {showSoundBanner && (
        <div className={styles.soundBanner}>
          <Icon name="volume" size={15} />
          <span>Включите звук — вы услышите сигнал при каждом новом вызове</span>
          <button className={styles.soundBannerBtn} onClick={enableSound}>
            Включить звук
          </button>
        </div>
      )}

      <div className={styles.header}>
        <h2 className={styles.title}>
          Вызовы{newCount > 0 ? ` · ${newCount} новых` : ''}
        </h2>
        <div className={styles.pollBadge}>
          <span className={styles.pollDot} />
          <span>обновляется каждые 8 с</span>
          {soundEnabled && <Icon name="volume" size={12} />}
        </div>
      </div>

      {uniqueCalls.length === 0 && (
        <EmptyState
          icon={<Icon name="bell-ringing" size={40} />}
          title="Вызовов пока нет"
          description="Новые вызовы официанта от гостей появятся здесь автоматически"
        />
      )}

      {groups.map((group) => (
        <div key={group.label} className={styles.dateGroup}>
          <div className={styles.dateLabel}>{group.label}</div>
          {group.calls.map((call) => (
            <CallCard
              key={call.id}
              call={call}
              isPending={statusMutation.isPending}
              onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
            />
          ))}
        </div>
      ))}

      {canLoadMore && (
        <div className={styles.loadOlderWrap}>
          <button
            className={styles.btnLoadOlder}
            disabled={loadingOlder}
            onClick={handleLoadOlder}
          >
            <Icon name="chevrons-down" size={14} />
            {loadingOlder ? 'Загружаю...' : 'Показать более ранние вызовы'}
          </button>
        </div>
      )}
    </div>
  );
}
