import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmptyState, Icon } from '@qrmenu/ui';
import { getOrders, updateOrderStatus, type Order } from '../../api/orders';
import styles from './OrdersPage.module.css';

// ── Timezone helpers (Asia/Almaty = UTC+5) ────────────────────────────────────

const ALMATY_OFFSET = 5 * 60; // minutes

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

function groupByDate(orders: Order[]): { label: string; orders: Order[] }[] {
  const groups: { label: string; orders: Order[] }[] = [];
  const seen = new Map<string, number>();

  for (const order of orders) {
    const dateKey = toAlmatyDate(order.created_at).toISOString().slice(0, 10);
    const label = formatDateLabel(order.created_at);
    if (!seen.has(dateKey)) {
      seen.set(dateKey, groups.length);
      groups.push({ label, orders: [] });
    }
    groups[seen.get(dateKey)!].orders.push(order);
  }

  return groups;
}

// ── Sound (Web Audio API, no external file) ──────────────────────────────────

function playBeep(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.4);
}

// ── Order Card ─────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: Order;
  onStatusChange: (id: string, status: 'new' | 'done') => void;
  isPending: boolean;
}

function OrderCard({ order, onStatusChange, isPending }: OrderCardProps) {
  const isNew = order.status === 'new';
  const isTable = order.order_type === 'table';

  return (
    <div className={`${styles.card} ${isNew ? styles.cardNew : styles.cardDone}`}>
      <div className={styles.cardBody}>
        {/* Top row: title + type badge + new badge */}
        <div className={styles.cardTop}>
          <div className={`${styles.cardTitle} ${!isNew ? styles.cardTitleDone : ''}`}>
            {isTable ? `Стол №${order.table_number}` : (order.customer_name || 'Предзаказ')}
          </div>
          <span className={`${styles.badge} ${isTable ? styles.badgeTable : styles.badgePreorder}`}>
            <Icon name={isTable ? 'armchair' : 'clock' } size={11} />
            {isTable ? 'За столом' : 'Предзаказ'}
          </span>
          {isNew && (
            <span className={`${styles.badge} ${styles.badgeNew}`}>
              <Icon name="bell-ringing" size={11} />
              Новый
            </span>
          )}
        </div>

        {/* Meta: time + menu name */}
        <div className={styles.cardMeta}>
          <span>{formatTime(order.created_at)}</span>
          <span className={styles.metaDivider} />
          <Icon name="tools-kitchen-2" size={12} />
          <span>{order.menu_name}</span>
        </div>

        {/* Contact info for preorders */}
        {!isTable && order.customer_phone && (
          <div className={styles.cardContact}>
            <Icon name="phone" size={13} />
            <span>{order.customer_phone}</span>
          </div>
        )}

        {/* Items */}
        <div className={styles.itemsList}>
          {order.items.map((item, i) => (
            <div key={i} className={styles.itemRow}>
              <span className={styles.itemName}>{item.name}</span>
              <span className={styles.itemQty}>× {item.quantity}</span>
              <span className={styles.itemPrice}>{(item.price * item.quantity).toLocaleString('ru-RU')} ₸</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Итого</span>
          <span className={styles.totalPrice}>{order.total_price.toLocaleString('ru-RU')} ₸</span>
        </div>

        {/* Comment */}
        {order.comment && order.comment.trim() && (
          <div className={styles.comment}>
            <Icon name="message" size={13} />
            <span>{order.comment}</span>
          </div>
        )}
      </div>

      {/* Footer: action button */}
      <div className={styles.cardFooter}>
        {isNew ? (
          <button
            className={styles.btnDone}
            disabled={isPending}
            onClick={() => onStatusChange(order.id, 'done')}
          >
            <Icon name="check" size={14} />
            Выполнен
          </button>
        ) : (
          <button
            className={styles.btnUndo}
            disabled={isPending}
            onClick={() => onStatusChange(order.id, 'new')}
          >
            <Icon name="rotate-left" size={14} />
            Вернуть в новые
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const queryClient = useQueryClient();

  // Sound state
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showSoundBanner, setShowSoundBanner] = useState(true);

  // Track known order IDs to detect new arrivals
  const knownIdsRef = useRef<Set<string> | null>(null);

  // Load-older state: accumulate older pages
  const [olderOrders, setOlderOrders] = useState<Order[]>([]);
  const [oldestCursor, setOldestCursor] = useState<string | null>(null);
  const [canLoadMore, setCanLoadMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  // ── Main query (last 7 days, polling) ──
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => getOrders(),
    refetchInterval: 8_000,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

  const recentOrders = data?.orders ?? [];

  // Detect new orders on each refetch and play sound
  useEffect(() => {
    if (!data) return;
    const ids = new Set(data.orders.map((o) => o.id));

    if (knownIdsRef.current === null) {
      // First load — just record, don't play
      knownIdsRef.current = ids;
      return;
    }

    const hasNew = data.orders.some((o) => !knownIdsRef.current!.has(o.id));
    knownIdsRef.current = ids;

    if (hasNew && soundEnabled && audioCtxRef.current) {
      playBeep(audioCtxRef.current);
    }
  }, [data, soundEnabled]);

  // Enable sound on explicit button click
  const enableSound = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setSoundEnabled(true);
    setShowSoundBanner(false);
    playBeep(audioCtxRef.current); // test beep
  }, []);

  // ── Status mutation ──
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'new' | 'done' }) =>
      updateOrderStatus(id, status),
    onSuccess: (updated) => {
      // Update in recent orders cache
      queryClient.setQueryData<{ orders: Order[]; has_more: boolean }>(
        ['admin-orders'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            orders: old.orders.map((o) => (o.id === updated.id ? updated : o)),
          };
        },
      );
      // Update in older orders too
      setOlderOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    },
  });

  // ── Load older ──
  const handleLoadOlder = async () => {
    // Find oldest order across both lists
    const all = [...recentOrders, ...olderOrders];
    if (all.length === 0) return;
    const oldest = all.reduce((a, b) =>
      new Date(a.created_at) < new Date(b.created_at) ? a : b,
    );
    setLoadingOlder(true);
    try {
      const result = await getOrders({ before: oldest.created_at, load_older: true });
      setOlderOrders((prev) => {
        const existingIds = new Set(prev.map((o) => o.id));
        const fresh = result.orders.filter((o) => !existingIds.has(o.id));
        return [...prev, ...fresh];
      });
      setOldestCursor(oldest.created_at);
      setCanLoadMore(result.has_more);
    } finally {
      setLoadingOlder(false);
    }
  };

  // Set canLoadMore from initial data
  useEffect(() => {
    if (data) setCanLoadMore(data.has_more);
  }, [data]);

  // Combined + sorted orders (recent first, then older, all sorted by created_at desc)
  const allOrders = [...recentOrders, ...olderOrders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  // Deduplicate (in case of overlap between recent + older windows)
  const uniqueOrders = allOrders.filter(
    (o, i, arr) => arr.findIndex((x) => x.id === o.id) === i,
  );

  const groups = groupByDate(uniqueOrders);
  const newCount = uniqueOrders.filter((o) => o.status === 'new').length;

  // ── Render ──

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonList}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Sound banner — shown until user enables sound */}
      {showSoundBanner && (
        <div className={styles.soundBanner}>
          <Icon name="volume" size={15} />
          <span>Включите звук — вы услышите сигнал при каждом новом заказе</span>
          <button className={styles.soundBannerBtn} onClick={enableSound}>
            Включить звук
          </button>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          Заказы{newCount > 0 ? ` · ${newCount} новых` : ''}
        </h2>
        <div className={styles.pollBadge}>
          <span className={styles.pollDot} />
          <span>обновляется каждые 8 с</span>
          {soundEnabled && <Icon name="volume" size={12} />}
        </div>
      </div>

      {/* Empty state */}
      {uniqueOrders.length === 0 && (
        <EmptyState
          icon={<Icon name="receipt" size={40} />}
          title="Заказов пока нет"
          description="Новые заказы от гостей появятся здесь автоматически"
        />
      )}

      {/* Order groups */}
      {groups.map((group) => (
        <div key={group.label} className={styles.dateGroup}>
          <div className={styles.dateLabel}>{group.label}</div>
          {group.orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isPending={statusMutation.isPending}
              onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
            />
          ))}
        </div>
      ))}

      {/* Load older */}
      {canLoadMore && (
        <div className={styles.loadOlderWrap}>
          <button
            className={styles.btnLoadOlder}
            disabled={loadingOlder}
            onClick={handleLoadOlder}
          >
            <Icon name="chevrons-down" size={14} />
            {loadingOlder ? 'Загружаю...' : 'Показать более ранние заказы'}
          </button>
        </div>
      )}
    </div>
  );
}
