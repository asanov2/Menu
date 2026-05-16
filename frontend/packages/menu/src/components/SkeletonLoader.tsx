import { Skeleton } from '@qrmenu/ui';
import type { ViewMode } from './ViewToggle';
import styles from './SkeletonLoader.module.css';

interface SkeletonLoaderProps {
  viewMode: ViewMode;
}

function ListSkeleton() {
  return (
    <div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className={styles.listItem}>
          <Skeleton width="52px" height="52px" borderRadius="8px" />
          <div className={styles.listItemInfo}>
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
    <div className={styles.cardGrid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={styles.cardItem}>
          <Skeleton width="100%" height="100px" borderRadius="0" />
          <div className={styles.cardItemBody}>
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
    <div className={styles.galleryGrid}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className={styles.galleryItem}>
          <Skeleton width="100%" height="70px" borderRadius="0" />
          <div className={styles.galleryItemBody}>
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
