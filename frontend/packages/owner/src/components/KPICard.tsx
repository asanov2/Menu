// === FILE: frontend/packages/owner/src/components/KPICard.tsx ===

interface KPICardProps {
  label: string
  value: string | number
  sub?: string
  subColor?: 'green' | 'red' | 'gold' | 'default'
  icon?: string
}

const SUB_COLORS = {
  green: '#4A8A30',
  red: 'var(--error-text)',
  gold: 'var(--accent-gold)',
  default: 'var(--ink-secondary)',
}

export default function KPICard({
  label,
  value,
  sub,
  subColor = 'default',
  icon,
}: KPICardProps) {
  return (
    <div
      style={{
        background: 'var(--cream-surface)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-card)',
        padding: '16px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {icon && (
        <span
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            fontSize: 32,
            opacity: 0.3,
            userSelect: 'none',
          }}
        >
          {icon}
        </span>
      )}
      <div
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-secondary)',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 600,
          color: 'var(--ink-primary)',
          lineHeight: 1,
          marginBottom: sub ? 6 : 0,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 10,
            color: SUB_COLORS[subColor],
            fontWeight: 500,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  )
}
