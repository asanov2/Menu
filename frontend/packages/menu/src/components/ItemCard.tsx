import { CSSProperties } from 'react';
import type { MenuItem } from '@qrmenu/ui';
import { TagBadge, formatPrice, getImageObjectPosition, getCleanImageUrl } from '@qrmenu/ui';

export type ItemCardMode = 'list' | 'card' | 'gallery';

interface ItemCardProps {
  item: MenuItem;
  mode: ItemCardMode;
  onClick: () => void;
}

function PrepBadge({ minutes }: { minutes: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        fontSize: 10,
        fontWeight: 500,
        fontFamily: 'var(--font-ui)',
        color: 'var(--ink-tertiary)',
        whiteSpace: 'nowrap',
      }}
    >
      ⏱ {minutes} мин
    </span>
  );
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
  const base: CSSProperties = {
    width,
    ...(height !== undefined ? { height } : {}),
    borderRadius,
    flexShrink: 0,
    display: 'block',
    filter: grayscale ? 'grayscale(1)' : undefined,
    aspectRatio: '1 / 1',
  };

  if (src) {
    return (
      <img src={src} alt={alt} loading="lazy" style={{ ...base, objectFit: 'cover', objectPosition: objectPosition ?? '50% 50%' }} />
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
        fontSize: Math.min((height ?? 56) * 0.5, 28),
      }}
    >
      🍽️
    </div>
  );
}

function ListCard({ item, onClick }: { item: MenuItem; onClick: () => void }) {
  const hasBadges = (item.tags ?? []).length > 0 || !item.is_available;
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        gap: 14,
        padding: '10px 16px',
        alignItems: 'center',
        cursor: 'pointer',
        opacity: item.is_available ? 1 : 0.55,
        borderBottom: '0.5px solid var(--cream-border)',
        WebkitTapHighlightColor: 'transparent',
        minHeight: 88,
      }}
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

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {hasBadges && (
          <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 4, marginBottom: 4, overflow: 'hidden', height: 20, alignItems: 'center' }}>
            {(item.tags ?? []).slice(0, 2).map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
            {!item.is_available && <StopBadge />}
          </div>
        )}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 17,
          fontWeight: 600,
          color: 'var(--ink-primary)',
          lineHeight: 1.3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 3,
        }}>
          {item.name}
        </div>
        {item.description && (
          <div style={{
            fontSize: 12,
            color: 'var(--ink-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.4,
          }}>
            {item.description}
          </div>
        )}
      </div>

      <div style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 4,
        paddingLeft: 8,
      }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-primary)', fontFamily: 'var(--font-ui)' }}>
          {formatPrice(item.price)}
        </span>
        {item.preparation_time && <PrepBadge minutes={item.preparation_time} />}
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
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* paddingTop:100% = width → always square regardless of neighbour card height */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '100%', overflow: 'hidden', background: 'var(--cream-muted)', flexShrink: 0 }}>
        {item.image_url ? (
          <img
            src={getCleanImageUrl(item.image_url) ?? undefined}
            alt={item.name}
            loading="lazy"
            draggable={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: getImageObjectPosition(item.image_url),
              display: 'block',
              filter: !item.is_available ? 'grayscale(1)' : undefined,
            }}
          />
        ) : (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
          }}>
            🍽️
          </div>
        )}
        {!item.is_available && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(26,18,8,0.25)',
          }}>
            <StopBadge />
          </div>
        )}
      </div>

      {/* Fixed-height text area so all cards in a row stay the same height */}
      <div style={{ padding: '10px 10px 10px', display: 'flex', flexDirection: 'column', height: 96 }}>
        <div style={{ height: 20, display: 'flex', alignItems: 'center', marginBottom: 3, overflow: 'hidden' }}>
          {item.tags?.[0] && <TagBadge tag={item.tags[0]} />}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--ink-primary)',
          lineHeight: 1.3,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          flex: 1,
        }}>
          {item.name}
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 4,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-ui)', color: 'var(--ink-primary)' }}>
            {formatPrice(item.price)}
          </span>
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
      <div style={{ position: 'relative', width: '100%', paddingTop: '100%', overflow: 'hidden', background: 'var(--cream-muted)', flexShrink: 0 }}>
        {item.image_url ? (
          <img
            src={getCleanImageUrl(item.image_url) ?? undefined}
            alt={item.name}
            loading="lazy"
            draggable={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: getImageObjectPosition(item.image_url),
              display: 'block',
              filter: !item.is_available ? 'grayscale(1)' : undefined,
            }}
          />
        ) : (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}>
            🍽️
          </div>
        )}
        {/* Tags overlay — bottom of image */}
        {(item.tags ?? []).length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: 4,
            left: 4,
            right: 4,
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
          }}>
            {(item.tags ?? []).slice(0, 2).map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: '6px 7px 7px', height: 44, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--ink-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.3,
        }}>
          {item.name}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-primary)', fontFamily: 'var(--font-ui)' }}>
            {formatPrice(item.price)}
          </span>
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
