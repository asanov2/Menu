import styles from './StatusDot.module.css'

interface StatusDotProps {
  status: 'online' | 'offline'
  showLabel?: boolean
}

export default function StatusDot({ status, showLabel }: StatusDotProps) {
  const isOnline = status === 'online'

  return (
    <span className={styles.wrapper}>
      <span className={`${styles.dot} ${isOnline ? styles.dotOnline : styles.dotOffline}`} />
      {showLabel && (
        <span className={`${styles.label} ${isOnline ? styles.labelOnline : styles.labelOffline}`}>
          {isOnline ? 'online' : 'offline'}
        </span>
      )}
    </span>
  )
}
