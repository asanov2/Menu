import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 24px',
        textAlign: 'center',
        background: 'var(--cream-muted)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <span style={{ fontSize: 48, lineHeight: 1, marginBottom: 16 }}>{icon}</span>

      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          fontWeight: 600,
          color: 'var(--ink-primary)',
          marginBottom: description ? 8 : 0,
          lineHeight: 1.25,
        }}
      >
        {title}
      </div>

      {description && (
        <div
          style={{
            fontSize: 14,
            color: 'var(--ink-secondary)',
            lineHeight: 1.6,
            maxWidth: 280,
            fontFamily: 'var(--font-ui)',
          }}
        >
          {description}
        </div>
      )}

      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}
