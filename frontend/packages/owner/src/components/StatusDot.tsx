// === FILE: frontend/packages/owner/src/components/StatusDot.tsx ===

interface StatusDotProps {
  status: 'online' | 'offline'
  showLabel?: boolean
}

export default function StatusDot({ status, showLabel }: StatusDotProps) {
  const isOnline = status === 'online'

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <style>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: isOnline ? 'var(--tag-green-text)' : 'var(--error-text)',
          animation: isOnline ? 'statusPulse 2s ease-in-out infinite' : 'none',
          flexShrink: 0,
        }}
      />
      {showLabel && (
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 10,
            color: isOnline ? 'var(--tag-green-text)' : 'var(--error-text)',
            fontWeight: 500,
          }}
        >
          {isOnline ? 'online' : 'offline'}
        </span>
      )}
    </span>
  )
}
