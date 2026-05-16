import type { CSSProperties, ReactNode } from 'react';
import styles from './SectionHeading.module.css';

interface SectionHeadingProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  action?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function SectionHeading({ children, size = 'md', action, style, className }: SectionHeadingProps) {
  const fontSize = { sm: 15, md: 18, lg: 22 }[size];
  return (
    <div className={`${styles.wrapper}${className ? ` ${className}` : ''}`} style={style}>
      <span className={styles.heading} style={{ fontSize }}>
        {children}
      </span>
      {action && <div>{action}</div>}
    </div>
  );
}
