import { useState, useMemo } from 'react';
import type { Category, MenuItem } from '@qrmenu/ui';

export const useSearch = (categories: Category[]) => {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo<MenuItem[] | null>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const results: MenuItem[] = [];
    categories
      .filter((c) => c.is_visible)
      .forEach((cat) => {
        cat.items.forEach((item) => {
          if (
            item.name.toLowerCase().includes(q) ||
            (item.description ?? '').toLowerCase().includes(q)
          ) {
            results.push(item);
          }
        });
      });

    return results;
  }, [query, categories]);

  return { query, setQuery, filteredItems };
};
