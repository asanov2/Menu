import { motion } from 'framer-motion';
import { ViewMode } from '../../../types/menu';

interface SkeletonLoaderProps {
  viewMode: ViewMode;
}

const shimmer = {
  backgroundImage:
    'linear-gradient(90deg, #F0EBE3 0%, #F8F4EE 50%, #F0EBE3 100%)',
  backgroundSize: '200% 100%',
};

function Bone({
  width,
  height,
  style,
}: {
  width?: string | number;
  height: string | number;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      style={{
        width,
        height,
        borderRadius: 6,
        flexShrink: 0,
        ...shimmer,
        ...style,
      }}
    />
  );
}

function ListSkeleton() {
  return (
    <div style={{ padding: '0 0' }}>
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
          <Bone width={52} height={52} style={{ borderRadius: 8 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Bone width="65%" height={14} />
            <Bone width="88%" height={11} />
          </div>
          <Bone width={48} height={14} />
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
            borderRadius: 12,
            border: '0.5px solid var(--cream-border)',
            overflow: 'hidden',
          }}
        >
          <Bone width="100%" height={100} style={{ borderRadius: 0 }} />
          <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Bone width="50%" height={10} />
            <Bone width="80%" height={13} />
            <Bone width="60%" height={10} />
            <Bone width="40%" height={13} />
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
            borderRadius: 10,
            border: '0.5px solid var(--cream-border)',
            overflow: 'hidden',
          }}
        >
          <Bone width="100%" height={70} style={{ borderRadius: 0 }} />
          <div style={{ padding: '5px 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Bone width="90%" height={10} />
            <Bone width="60%" height={11} />
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
