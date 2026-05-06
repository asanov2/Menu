interface PaginationBarProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const BTN: React.CSSProperties = {
  padding: '5px 12px',
  fontFamily: 'var(--font-ui)',
  fontSize: 12,
  border: '1px solid var(--cream-border)',
  borderRadius: 'var(--radius-sm)',
  background: 'transparent',
  cursor: 'pointer',
};

export default function PaginationBar({ page, totalPages, totalCount, pageSize, onPageChange }: PaginationBarProps) {
  if (totalCount === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--cream-border)' }}>
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-secondary)' }}>
        {from}–{to} из {totalCount}
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          style={{ ...BTN, color: page === 1 ? 'var(--ink-tertiary)' : 'var(--ink-primary)' }}
        >
          ← Назад
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          style={{ ...BTN, color: page >= totalPages ? 'var(--ink-tertiary)' : 'var(--ink-primary)' }}
        >
          Вперёд →
        </button>
      </div>
    </div>
  );
}
