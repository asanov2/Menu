import { useRef, useEffect } from 'react';
import type { Category } from '@qrmenu/ui';
import styles from './CategoryTabs.module.css';

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
    <div ref={containerRef} className={styles.container}>
      {categories
        .filter((c) => c.is_visible)
        .map((cat) => {
          const active = cat.id === activeId;
          return (
            <button
              key={cat.id}
              data-active={active}
              onClick={() => onSelect(cat.id)}
              className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            >
              {cat.name}
            </button>
          );
        })}
    </div>
  );
}
