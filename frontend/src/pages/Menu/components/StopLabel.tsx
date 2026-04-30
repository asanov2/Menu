export default function StopLabel() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 7px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 500,
        lineHeight: '1.5',
        fontFamily: 'DM Sans, sans-serif',
        background: 'var(--cream-muted)',
        color: 'var(--ink-secondary)',
        border: '0.5px solid var(--cream-border)',
        whiteSpace: 'nowrap',
      }}
    >
      Нет в наличии
    </span>
  );
}
