import type { CSSProperties } from 'react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
  ariaHidden?: boolean;
  ariaLabel?: string;
}

export function Icon({
  name,
  size = 18,
  className,
  style,
  ariaHidden = true,
  ariaLabel,
}: IconProps) {
  return (
    <i
      className={`ti ti-${name}${className ? ` ${className}` : ''}`}
      style={{ fontSize: size, lineHeight: 1, ...style }}
      aria-hidden={ariaHidden || undefined}
      aria-label={ariaLabel}
    />
  );
}
