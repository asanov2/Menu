import { ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon: ReactNode;
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
    <div className={styles.container}>
      <span className={styles.icon}>{icon}</span>

      <div
        className={styles.title}
        style={{ marginBottom: description ? 8 : 0 }}
      >
        {title}
      </div>

      {description && (
        <div className={styles.description}>{description}</div>
      )}

      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
