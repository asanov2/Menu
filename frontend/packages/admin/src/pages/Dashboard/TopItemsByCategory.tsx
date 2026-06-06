import { useState } from 'react';
import type { CategoryTopItems, TopItem } from '@qrmenu/ui';
import { Skeleton, Icon } from '@qrmenu/ui';
import styles from './TopItemsByCategory.module.css';

interface Props {
  categories: CategoryTopItems[];
  isLoading: boolean;
  mode?: 'views' | 'orders';
}

function ItemImage({ name, imageUrl }: { name: string | null; imageUrl: string | null }) {
  const [errored, setErrored] = useState(false);

  if (imageUrl && !errored) {
    return (
      <img
        src={imageUrl}
        alt={name ?? ''}
        className={styles.itemImg}
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <div className={styles.imgPlaceholder}>
      {name?.[0]?.toUpperCase() ?? <Icon name="tools-kitchen-2" size={20} />}
    </div>
  );
}

const RANK_COLORS = ['#c9a227', '#8e9ba5', '#c07d4f'];

function ItemRow({ item, mode = 'views' }: { item: TopItem; mode?: 'views' | 'orders' }) {
  const isTopThree = item.rank <= 3;
  const rankDisplay = String(item.rank);
  const rankClass = isTopThree
    ? styles[`rank${item.rank}` as keyof typeof styles]
    : styles.rankDefault;

  return (
    <div className={styles.itemRow}>
      <span
        className={`${styles.rank} ${rankClass}`}
        style={isTopThree ? { color: RANK_COLORS[item.rank - 1] } : undefined}
      >
        {rankDisplay}
      </span>
      <div className={styles.imgWrap}>
        <ItemImage name={item.name} imageUrl={item.image_url} />
      </div>
      <span className={`${styles.itemName} ${item.is_deleted ? styles.deletedItem : ''}`}>
        {item.name ?? '(блюдо удалено)'}
        {item.is_deleted && (
          <span className={styles.deletedBadge}>удалено</span>
        )}
      </span>
      <span className={styles.viewsBadge}>
        {mode === 'orders' ? (
          <Icon name="shopping-cart" size={13} />
        ) : (
          <svg className={styles.eyeIcon} viewBox="0 0 16 16" fill="none">
            <path d="M8 3C4.5 3 1.5 8 1.5 8s3 5 6.5 5 6.5-5 6.5-5-3-5-6.5-5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
        )}
        {item.views.toLocaleString('ru-RU')}
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className={styles.catCard}>
      <div className={styles.catHeader}>
        <Skeleton height="12px" width="60%" />
      </div>
      <div className={styles.itemList}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.itemRowSkeleton}>
            <Skeleton height="44px" width="44px" />
            <div className={styles.skeletonText}>
              <Skeleton height="12px" width="80%" />
              <Skeleton height="10px" width="40%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TopItemsByCategory({ categories, isLoading, mode = 'views' }: Props) {
  if (isLoading) {
    return (
      <div className={styles.scroll}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className={styles.empty}>
        <Icon name="chart-bar-off" size={36} className={styles.emptyIcon} />
        {mode === 'orders' ? (
          <>
            <p>Пока нет заказов за выбранный период</p>
            <small>Заказы появятся здесь после первого оформления</small>
          </>
        ) : (
          <>
            <p>Нет данных о просмотрах блюд</p>
            <small>Открывайте карточки блюд в меню — статистика появится завтра</small>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={styles.scroll}>
      {categories.map((cat) => {
        const allDeleted = cat.items.length > 0 && cat.items.every(item => item.is_deleted);
        return (
        <div key={cat.category_id ?? '__none__'} className={styles.catCard}>
          <div className={styles.catHeader}>
            <span className={styles.catName}>
              {cat.category_name ?? 'Без категории'}
              {allDeleted && (
                <span className={styles.catDeletedNote}> · удалена</span>
              )}
            </span>
            <span className={styles.catTotal}>
              {cat.total_views} {mode === 'orders' ? 'заказов' : 'просм.'}
            </span>
          </div>
          <div className={styles.itemList}>
            {cat.items.map((item) => (
              <ItemRow key={item.item_id} item={item} mode={mode} />
            ))}
          </div>
        </div>
        );
      })}
    </div>
  );
}
