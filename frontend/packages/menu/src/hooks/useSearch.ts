import { useState, useMemo } from 'react';
import type { Category, MenuItem } from '@qrmenu/ui';

export const useSearch = (categories: Category[]) => {
  const [query, setQuery] = useState('');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

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

  // Set of item IDs that contain at least one of the selected allergens.
  // Computed across ALL items so markers are consistent everywhere.
  const flaggedItemIds = useMemo<Set<string>>(() => {
    if (!selectedAllergens.length) return new Set();
    const flagged = new Set<string>();
    categories.forEach((cat) => {
      cat.items.forEach((item) => {
        const allergens = item.allergens ?? [];
        if (allergens.some((a) => selectedAllergens.includes(a))) {
          flagged.add(item.id);
        }
      });
    });
    return flagged;
  }, [selectedAllergens, categories]);

  const toggleAllergen = (code: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  return {
    query,
    setQuery,
    filteredItems,
    selectedAllergens,
    toggleAllergen,
    flaggedItemIds,
  };
};
