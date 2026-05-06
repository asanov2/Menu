import type { CSSProperties, ReactNode } from 'react';

interface SectionHeadingProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  action?: ReactNode;
  style?: CSSProperties;
}

export function SectionHeading({ children, size = 'md', action, style }: SectionHeadingProps) {
  const fontSize = { sm: 15, md: 18, lg: 22 }[size];
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      ...style,
    }}>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize,
        color: 'var(--ink-primary)',
        lineHeight: 1.2,
      }}>
        {children}
      </span>
      {action && <div>{action}</div>}
    </div>
  );
}
