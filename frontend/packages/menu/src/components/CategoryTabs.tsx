import { useRef, useEffect } from 'react';
import type { Category } from '@qrmenu/ui';

interface CategoryTabsProps {
  categories: Category[];
  activeId: string;
  onSelect: (id: string) => void;
}

export default function CategoryTabs({ categories, activeId, onSelect }: CategoryTabsProps) {
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
        background: 'var(--ink-primary)',
        padding: '0 16px',
      }}
    >
      {categories
        .filter((c) => c.is_visible)
        .map((cat) => {
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
                fontFamily: 'var(--font-ui)',
                fontWeight: active ? 500 : 400,
                color: active ? 'var(--sidebar-text)' : 'var(--sidebar-muted)',
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid var(--accent-gold)' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {cat.name}
            </button>
          );
        })}
    </div>
  );
}
