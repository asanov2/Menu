import { Skeleton } from '@qrmenu/ui';
import type { ViewMode } from './ViewToggle';

interface SkeletonLoaderProps {
  viewMode: ViewMode;
}

function ListSkeleton() {
  return (
    <div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 12,
            padding: '10px 16px',
            alignItems: 'center',
            borderBottom: '0.5px solid var(--cream-border)',
          }}
        >
          <Skeleton width="52px" height="52px" borderRadius="8px" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton width="65%" height="14px" />
            <Skeleton width="88%" height="11px" />
          </div>
          <Skeleton width="52px" height="14px" />
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        padding: '12px 16px',
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            borderRadius: 'var(--radius-lg)',
            border: '0.5px solid var(--cream-border)',
            overflow: 'hidden',
          }}
        >
          <Skeleton width="100%" height="100px" borderRadius="0" />
          <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton width="50%" height="10px" />
            <Skeleton width="80%" height="13px" />
            <Skeleton width="40%" height="13px" />
          </div>
        </div>
      ))}
    </div>
  );
}

function GallerySkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 6,
        padding: '12px 16px',
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          style={{
            borderRadius: 'var(--radius-md)',
            border: '0.5px solid var(--cream-border)',
            overflow: 'hidden',
          }}
        >
          <Skeleton width="100%" height="70px" borderRadius="0" />
          <div style={{ padding: '5px 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Skeleton width="90%" height="10px" />
            <Skeleton width="60%" height="11px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SkeletonLoader({ viewMode }: SkeletonLoaderProps) {
  if (viewMode === 'card') return <CardSkeleton />;
  if (viewMode === 'gallery') return <GallerySkeleton />;
  return <ListSkeleton />;
}
