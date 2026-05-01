interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
}

export default function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius = 'var(--radius-sm)',
}: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background:
          'linear-gradient(90deg, var(--cream-muted) 0%, var(--cream-border) 50%, var(--cream-muted) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s infinite linear',
        flexShrink: 0,
      }}
    />
  );
}
