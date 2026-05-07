import { CSSProperties } from 'react';
import type { MenuItem } from '@qrmenu/ui';
import { TagBadge, formatPrice } from '@qrmenu/ui';

export type ItemCardMode = 'list' | 'card' | 'gallery';

interface ItemCardProps {
  item: MenuItem;
  mode: ItemCardMode;
  onClick: () => void;
}

function StopBadge() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 7px',
        borderRadius: 'var(--radius-sm)',
        fontSize: 9,
        fontWeight: 500,
        lineHeight: 1.5,
        fontFamily: 'var(--font-ui)',
        background: 'var(--cream-muted)',
        color: 'var(--ink-secondary)',
        border: '0.5px solid var(--cream-border)',
        whiteSpace: 'nowrap',
      }}
    >
      Нет в наличии
    </span>
  );
}

function ItemImage({
  src,
  alt,
  width,
  height,
  borderRadius,
  grayscale,
}: {
  src: string | null;
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
    aspectRatio: '1',
  };

  if (src) {
    return (
      <img src={src} alt={alt} loading="lazy" style={{ ...base, objectFit: 'cover' }} />
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
      🍽️
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
        opacity: item.is_available ? 1 : 0.55,
        borderBottom: '0.5px solid var(--cream-border)',
        minHeight: 44,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <ItemImage
        src={item.image_url}
        alt={item.name}
        width={52}
        height={52}
        borderRadius={8}
        grayscale={!item.is_available}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
          {(item.tags ?? []).map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
          {!item.is_available && <StopBadge />}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--ink-primary)',
            lineHeight: 1.3,
          }}
        >
          {item.name}
        </div>
        {item.description && (
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
        )}
      </div>

      <div
        style={{
          flexShrink: 0,
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--ink-primary)',
          fontFamily: 'var(--font-ui)',
          textAlign: 'right',
        }}
      >
        {formatPrice(item.price)}
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
        borderRadius: 'var(--radius-lg)',
        border: '0.5px solid var(--cream-border)',
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: item.is_available ? 1 : 0.65,
        boxShadow: 'var(--shadow-card)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ position: 'relative' }}>
        <ItemImage
          src={item.image_url}
          alt={item.name}
          width="100%"
          height={100}
          borderRadius={0}
          grayscale={!item.is_available}
        />
        {!item.is_available && (
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
            <StopBadge />
          </div>
        )}
      </div>

      <div style={{ padding: '8px 10px' }}>
        <div style={{ marginBottom: 4, minHeight: 18 }}>
          {item.tags?.[0] && <TagBadge tag={item.tags[0]} />}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--ink-primary)',
            lineHeight: 1.3,
            marginBottom: 2,
          }}
        >
          {item.name}
        </div>
        {item.description && (
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
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 6,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-ui)' }}>
            {formatPrice(item.price)}
          </span>
          {item.preparation_time && (
            <span style={{ fontSize: 10, color: 'var(--ink-tertiary)' }}>
              ~{item.preparation_time} мин
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
        borderRadius: 'var(--radius-md)',
        border: '0.5px solid var(--cream-border)',
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: item.is_available ? 1 : 0.65,
        boxShadow: 'var(--shadow-card)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <ItemImage
        src={item.image_url}
        alt={item.name}
        width="100%"
        height={70}
        borderRadius={0}
        grayscale={!item.is_available}
      />
      <div style={{ padding: '5px 6px' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
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
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-primary)', fontFamily: 'var(--font-ui)' }}>
          {formatPrice(item.price)}
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
