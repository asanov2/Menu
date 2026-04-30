import { CSSProperties } from 'react';
import { MenuItem } from '../../../types/menu';
import TagBadge from './TagBadge';
import StopLabel from './StopLabel';

export type ItemCardMode = 'list' | 'card' | 'gallery';

interface ItemCardProps {
  item: MenuItem;
  mode: ItemCardMode;
  onClick: () => void;
}

function formatPrice(price: number, currency: string) {
  return `${price.toLocaleString()} ${currency}`;
}

function ItemImage({
  src,
  emoji,
  alt,
  width,
  height,
  borderRadius,
  grayscale,
}: {
  src?: string;
  emoji?: string;
  alt: string;
  width?: string | number;
  height: number;
  borderRadius?: number | string;
  grayscale?: boolean;
}) {
  const base: CSSProperties = {
    width,
    height,
    borderRadius,
    flexShrink: 0,
    display: 'block',
    filter: grayscale ? 'grayscale(1)' : undefined,
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        style={{ ...base, objectFit: 'cover' }}
      />
    );
  }

  return (
    <div
      style={{
        ...base,
        background: 'var(--cream-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.min(height * 0.5, 28),
      }}
    >
      {emoji || '🍽️'}
    </div>
  );
}

function ListCard({ item, onClick }: { item: MenuItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        gap: 12,
        padding: '10px 16px',
        alignItems: 'center',
        cursor: 'pointer',
        opacity: item.isAvailable ? 1 : 0.55,
        borderBottom: '0.5px solid var(--cream-border)',
        minHeight: 44,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <ItemImage
        src={item.image}
        emoji={item.emoji}
        alt={item.name}
        width={52}
        height={52}
        borderRadius={8}
        grayscale={!item.isAvailable}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
          {item.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
          {!item.isAvailable && <StopLabel />}
        </div>
        <div
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--ink-primary)',
            lineHeight: 1.3,
          }}
        >
          {item.name}
        </div>
        <div
          style={{
            fontSize: 10,
            color: 'var(--ink-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: 2,
          }}
        >
          {item.description}
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--ink-primary)',
          fontFamily: 'DM Sans, sans-serif',
          textAlign: 'right',
        }}
      >
        {formatPrice(item.price, item.currency)}
      </div>
    </div>
  );
}

function CardCard({ item, onClick }: { item: MenuItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--cream-surface)',
        borderRadius: 12,
        border: '0.5px solid var(--cream-border)',
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: item.isAvailable ? 1 : 0.65,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ position: 'relative' }}>
        <ItemImage
          src={item.image}
          emoji={item.emoji}
          alt={item.name}
          width="100%"
          height={100}
          borderRadius={0}
          grayscale={!item.isAvailable}
        />
        {!item.isAvailable && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(26,18,8,0.25)',
            }}
          >
            <StopLabel />
          </div>
        )}
      </div>

      <div style={{ padding: '8px 10px' }}>
        <div style={{ marginBottom: 4, minHeight: 18 }}>
          {item.tags[0] && <TagBadge tag={item.tags[0]} />}
        </div>
        <div
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--ink-primary)',
            lineHeight: 1.3,
            marginBottom: 2,
          }}
        >
          {item.name}
        </div>
        <div
          style={{
            fontSize: 10,
            color: 'var(--ink-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: 6,
          }}
        >
          {item.description}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {formatPrice(item.price, item.currency)}
          </span>
          {item.preparationTime && (
            <span style={{ fontSize: 10, color: 'var(--ink-tertiary)' }}>
              ~{item.preparationTime} мин
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function GalleryCard({ item, onClick }: { item: MenuItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--cream-surface)',
        borderRadius: 10,
        border: '0.5px solid var(--cream-border)',
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: item.isAvailable ? 1 : 0.65,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <ItemImage
        src={item.image}
        emoji={item.emoji}
        alt={item.name}
        width="100%"
        height={70}
        borderRadius={0}
        grayscale={!item.isAvailable}
      />
      <div style={{ padding: '5px 6px' }}>
        <div
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--ink-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: 2,
            lineHeight: 1.3,
          }}
        >
          {item.name}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--ink-primary)',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {formatPrice(item.price, item.currency)}
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
