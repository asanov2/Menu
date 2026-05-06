import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@qrmenu/ui';
import type { Category } from '@qrmenu/ui';
import { reorderCategories } from '../../../api/categories';

export function useCategoryDnd(menuId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const handleDragEnd = async (event: DragEndEvent, categories: Category[]) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex(c => c.id === active.id);
    const newIndex = categories.findIndex(c => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);

    queryClient.setQueryData(['categories', menuId], reordered);

    try {
      await reorderCategories(reordered.map((c, i) => ({ id: c.id, sort_order: i })));
    } catch {
      queryClient.invalidateQueries({ queryKey: ['categories', menuId] });
      showToast('Ошибка сортировки', 'error');
    }
  };

  return { handleDragEnd };
}
