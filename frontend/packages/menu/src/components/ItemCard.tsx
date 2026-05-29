import type { MenuItem } from '@qrmenu/ui';
import { TagBadge, Icon, formatPrice, getImageObjectPosition, getCleanImageUrl } from '@qrmenu/ui';
import { ALLERGEN_MAP } from '../constants/allergens';
import styles from './ItemCard.module.css';

export type ItemCardMode = 'list' | 'card' | 'gallery';

function AllergenIcons({ allergens }: { allergens: string[] }) {
  if (!allergens.length) return null;
  const visible = allergens.slice(0, 4);
  const extra = allergens.length - 4;
  return (
    <>
      {visible.map((code) => {
        const info = ALLERGEN_MAP[code];
        if (!info) return null;
        return <Icon key={code} name={info.icon} size={13} className={styles.allergenIcon} />;
      })}
      {extra > 0 && <span className={styles.allergenMore}>+{extra}</span>}
    </>
  );
}

interface ItemCardProps {
  item: MenuItem;
  mode: ItemCardMode;
  onClick: () => void;
  isFlagged?: boolean;
  onAddToCart?: (item: MenuItem) => void;
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

function NutritionBadge({ item, compact = false }: { item: MenuItem; compact?: boolean }) {
  if (item.calories == null) return null;
  const cal = compact ? Math.round(item.calories) : item.calories;
  const parts: string[] = [`~${cal} ккал`];
  if (!compact) {
    if (item.protein != null) parts.push(`Б ${item.protein}`);
    if (item.fat != null) parts.push(`Ж ${item.fat}`);
    if (item.carbs != null) parts.push(`У ${item.carbs}`);
  }
  return (
    <span className={styles.nutritionBadge}>
      <i className="ti ti-flame" style={{ fontSize: 9 }} />
      {parts.join(' · ')}
    </span>
  );
}

function ListCard({ item, onClick, isFlagged, onAddToCart }: { item: MenuItem; onClick: () => void; isFlagged?: boolean; onAddToCart?: (item: MenuItem) => void }) {
  const hasBadges = (item.tags ?? []).length > 0 || !item.is_available;
  const hasMeta = item.calories != null || (item.allergens ?? []).length > 0 || isFlagged;
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
        {hasMeta && (
          <div className={styles.listMetaRow}>
            <NutritionBadge item={item} />
            <AllergenIcons allergens={item.allergens ?? []} />
            {isFlagged && (
              <div className={styles.allergenWarning}>
                <Icon name="alert-triangle" size={11} />
                <span>аллерген</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.listPriceSide}>
        <span className={styles.listPrice}>{formatPrice(item.price)}</span>
        {item.preparation_time && <PrepBadge minutes={item.preparation_time} />}
        {onAddToCart && item.is_available && (
          <button
            className={styles.addBtn}
            onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
            aria-label="Добавить в корзину"
          >
            <i className="ti ti-plus" style={{ fontSize: 14 }} />
          </button>
        )}
      </div>
    </div>
  );
}

function CardCard({ item, onClick, isFlagged, onAddToCart }: { item: MenuItem; onClick: () => void; isFlagged?: boolean; onAddToCart?: (item: MenuItem) => void }) {
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
        {item.tags?.[0] && (
          <div className={styles.photoTagOverlay}>
            <TagBadge tag={item.tags[0]} />
          </div>
        )}
        {onAddToCart && item.is_available && (
          <button
            className={styles.photoAddBtn}
            onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
            aria-label="Добавить в корзину"
          >
            <i className="ti ti-plus" style={{ fontSize: 14 }} />
          </button>
        )}
        {!item.is_available && (
          <div className={styles.cardUnavailableOverlay}>
            <StopBadge />
          </div>
        )}
      </div>

      <div className={styles.cardTextArea}>
        <div className={styles.cardName}>{item.name}</div>

        {item.calories != null && <NutritionBadge item={item} compact />}

        {((item.allergens ?? []).length > 0 || isFlagged) && (
          <div className={styles.cardAllergenRow}>
            <AllergenIcons allergens={item.allergens ?? []} />
            {isFlagged && (
              <div className={styles.allergenWarning}>
                <Icon name="alert-triangle" size={11} />
                <span>аллерген</span>
              </div>
            )}
          </div>
        )}

        <div className={styles.cardPriceRow}>
          <span className={styles.cardPrice}>{formatPrice(item.price)}</span>
          {item.preparation_time && <PrepBadge minutes={item.preparation_time} />}
        </div>
      </div>
    </div>
  );
}

function GalleryCard({ item, onClick, isFlagged, onAddToCart }: { item: MenuItem; onClick: () => void; isFlagged?: boolean; onAddToCart?: (item: MenuItem) => void }) {
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
        {item.tags?.[0] && (
          <div className={styles.photoTagOverlay}>
            <TagBadge tag={item.tags[0]} />
          </div>
        )}
        {onAddToCart && item.is_available && (
          <button
            className={styles.photoAddBtn}
            onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
            aria-label="Добавить в корзину"
          >
            <i className="ti ti-plus" style={{ fontSize: 13 }} />
          </button>
        )}
      </div>

      <div className={styles.galleryTextArea}>
        <div className={styles.galleryName}>{item.name}</div>

        {item.calories != null && <NutritionBadge item={item} compact />}

        {((item.allergens ?? []).length > 0 || isFlagged) && (
          <div className={styles.galleryAllergenRow}>
            <AllergenIcons allergens={item.allergens ?? []} />
            {isFlagged && (
              <div className={styles.allergenWarning}>
                <Icon name="alert-triangle" size={10} />
                <span>аллерген</span>
              </div>
            )}
          </div>
        )}

        <div className={styles.galleryPriceRow}>
          <span className={styles.galleryPrice}>{formatPrice(item.price)}</span>
          {item.preparation_time && <PrepBadge minutes={item.preparation_time} />}
        </div>
      </div>
    </div>
  );
}

export default function ItemCard({ item, mode, onClick, isFlagged, onAddToCart }: ItemCardProps) {
  if (mode === 'list') return <ListCard item={item} onClick={onClick} isFlagged={isFlagged} onAddToCart={onAddToCart} />;
  if (mode === 'card') return <CardCard item={item} onClick={onClick} isFlagged={isFlagged} onAddToCart={onAddToCart} />;
  return <GalleryCard item={item} onClick={onClick} isFlagged={isFlagged} onAddToCart={onAddToCart} />;
}
