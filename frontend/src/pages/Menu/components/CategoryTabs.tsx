import { useRef, useEffect } from 'react';
import { Category } from '../../../types/menu';

interface CategoryTabsProps {
  categories: Category[];
  activeId: string;
  onSelect: (id: string) => void;
}

export default function CategoryTabs({
  categories,
  activeId,
  onSelect,
}: CategoryTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const active = container?.querySelector<HTMLElement>('[data-active="true"]');
    if (active && container) {
      active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeId]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        overflowX: 'auto',
        background: '#221A10',
        padding: '0 16px',
        gap: 0,
      }}
    >
      {categories.map((cat) => {
        const active = cat.id === activeId;
        return (
          <button
            key={cat.id}
            data-active={active}
            onClick={() => onSelect(cat.id)}
            style={{
              flexShrink: 0,
              padding: '0 12px',
              height: 44,
              fontSize: 11,
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: active ? 500 : 400,
              color: active ? '#FDFAF5' : '#A09080',
              background: 'none',
              border: 'none',
              borderBottom: active ? '2px solid #D4A853' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {cat.emoji && (
              <span style={{ marginRight: 4 }}>{cat.emoji}</span>
            )}
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
