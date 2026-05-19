import type { MenuItem } from '@qrmenu/ui';
import { TagBadge, formatPrice, getImageObjectPosition, getCleanImageUrl } from '@qrmenu/ui';
import styles from './ItemCard.module.css';

export type ItemCardMode = 'list' | 'card' | 'gallery';

interface ItemCardProps {
  item: MenuItem;
  mode: ItemCardMode;
  onClick: () => void;
}

function PrepBadge({ minutes }: { minutes: number }) {
  return (
    <span className={styles.prepBadge}>
      ⏱ {minutes} мин
    </span>
  );
}

function StopBadge() {
  return <span className={styles.stopBadge}>Нет в наличии</span>;
}

function ItemImage({
  src,
  alt,
  width,
  height,
  borderRadius,
  grayscale,
  objectPosition,
}: {
  src: string | null;
  alt: string;
  width?: string | number;
  height?: number;
  borderRadius?: number | string;
  grayscale?: boolean;
  objectPosition?: string;
}) {
  const sizeStyle = { width, ...(height !== undefined ? { height } : {}), borderRadius };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`${styles.imgBase} ${grayscale ? styles.grayscale : ''}`}
        style={{ ...sizeStyle, objectFit: 'cover', objectPosition: objectPosition ?? '50% 50%' }}
      />
    );
  }

  return (
    <div
      className={styles.imgPlaceholder}
      style={{ ...sizeStyle, fontSize: Math.min((height ?? 56) * 0.5, 28) }}
    >
      <i className="ti ti-tools-kitchen-2" style={{ fontSize: 24 }} />
    </div>
  );
}

function ListCard({ item, onClick }: { item: MenuItem; onClick: () => void }) {
  const hasBadges = (item.tags ?? []).length > 0 || !item.is_available;
  return (
    <div
      onClick={onClick}
      className={`${styles.listRow} ${!item.is_available ? styles.listRowUnavailable : ''}`}
    >
      <ItemImage
        src={getCleanImageUrl(item.image_url)}
        alt={item.name}
        width={68}
        height={68}
        borderRadius={10}
        grayscale={!item.is_available}
        objectPosition={getImageObjectPosition(item.image_url)}
      />

      <div className={styles.listInfo}>
        {hasBadges && (
          <div className={styles.listBadges}>
            {(item.tags ?? []).slice(0, 2).map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
            {!item.is_available && <StopBadge />}
          </div>
        )}
        <div className={styles.listName}>{item.name}</div>
        {item.description && (
          <div className={styles.listDesc}>{item.description}</div>
        )}
      </div>

      <div className={styles.listPriceSide}>
        <span className={styles.listPrice}>{formatPrice(item.price)}</span>
        {item.preparation_time && <PrepBadge minutes={item.preparation_time} />}
      </div>
    </div>
  );
}

function CardCard({ item, onClick }: { item: MenuItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`${styles.cardCard} ${!item.is_available ? styles.cardCardUnavailable : ''}`}
    >
      <div className={styles.cardImageContainer}>
        {item.image_url ? (
          <img
            src={getCleanImageUrl(item.image_url) ?? undefined}
            alt={item.name}
            loading="lazy"
            draggable={false}
            className={`${styles.cardImg} ${!item.is_available ? styles.grayscale : ''}`}
            style={{ objectPosition: getImageObjectPosition(item.image_url) }}
          />
        ) : (
          <div className={styles.cardNoImg}><i className="ti ti-tools-kitchen-2" style={{ fontSize: 24 }} /></div>
        )}
        {!item.is_available && (
          <div className={styles.cardUnavailableOverlay}>
            <StopBadge />
          </div>
        )}
      </div>

      <div className={styles.cardTextArea}>
        <div className={styles.cardTagRow}>
          {item.tags?.[0] && <TagBadge tag={item.tags[0]} />}
        </div>
        <div className={styles.cardName}>{item.name}</div>
        <div className={styles.cardPriceRow}>
          <span className={styles.cardPrice}>{formatPrice(item.price)}</span>
          {item.preparation_time && <PrepBadge minutes={item.preparation_time} />}
        </div>
      </div>
    </div>
  );
}

function GalleryCard({ item, onClick }: { item: MenuItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`${styles.galleryCard} ${!item.is_available ? styles.galleryCardUnavailable : ''}`}
    >
      <div className={styles.galleryImageContainer}>
        {item.image_url ? (
          <img
            src={getCleanImageUrl(item.image_url) ?? undefined}
            alt={item.name}
            loading="lazy"
            draggable={false}
            className={`${styles.galleryImg} ${!item.is_available ? styles.grayscale : ''}`}
            style={{ objectPosition: getImageObjectPosition(item.image_url) }}
          />
        ) : (
          <div className={styles.galleryNoImg}><i className="ti ti-tools-kitchen-2" style={{ fontSize: 24 }} /></div>
        )}
        {(item.tags ?? []).length > 0 && (
          <div className={styles.galleryTagsOverlay}>
            {(item.tags ?? []).slice(0, 2).map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
      </div>
      <div className={styles.galleryTextArea}>
        <div className={styles.galleryName}>{item.name}</div>
        <div className={styles.galleryPriceRow}>
          <span className={styles.galleryPrice}>{formatPrice(item.price)}</span>
          {item.preparation_time && <PrepBadge minutes={item.preparation_time} />}
        </div>
      </div>
    </div>
  );
}

export default function ItemCard({ item, mode, onClick }: ItemCardProps) {
  if (mode === 'list') return <ListCard item={item} onClick={onClick} />;
  if (mode === 'card') return <CardCard item={item} onClick={onClick} />;
  return <GalleryCard item={item} onClick={onClick} />;
}
