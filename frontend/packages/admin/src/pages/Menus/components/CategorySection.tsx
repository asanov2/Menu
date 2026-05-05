import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useToast, ConfirmModal, EmptyState, getApiErrorMessage } from '@qrmenu/ui';
import type { Category, MenuItem } from '@qrmenu/ui';
import { deleteCategory } from '../../../api/categories';
import { createItem, updateItem, reorderItems } from '../../../api/items';
import SortableItem from './SortableItem';
import ItemFormModal from './ItemFormModal';
import CategoryFormModal from './CategoryFormModal';
import { updateCategory } from '../../../api/categories';

interface CategorySectionProps {
  category: Category;
  allCategories: Category[];
  menuId: string;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export default function CategorySection({ category, allCategories, menuId, dragHandleProps }: CategorySectionProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [items, setItems] = useState<MenuItem[]>(category.items ?? []);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>();
  const [itemSaving, setItemSaving] = useState(false);
  const [editCatOpen, setEditCatOpen] = useState(false);
  const [catSaving, setCatSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    try {
      await reorderItems(reordered.map((item, idx) => ({ id: item.id, sort_order: idx })));
    } catch {
      setItems(items);
      showToast('Ошибка сортировки', 'error');
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemFormOpen(true);
  };

  const handleSaveItem = async (data: Partial<MenuItem> & { category_id: string }) => {
    setItemSaving(true);
    try {
      if (editingItem) {
        await updateItem(editingItem.id, data);
        showToast('Блюдо обновлено ✓', 'success');
      } else {
        await createItem({ name: data.name!, price: data.price!, category_id: data.category_id, ...data });
        showToast('Блюдо добавлено ✓', 'success');
      }
      queryClient.invalidateQueries({ queryKey: ['categories', menuId] });
      setItemFormOpen(false);
      setEditingItem(undefined);
    } catch (err: unknown) {
      showToast(`Ошибка: ${getApiErrorMessage(err)}`, 'error');
    } finally {
      setItemSaving(false);
    }
  };

  const handleSaveCategory = async (name: string) => {
    setCatSaving(true);
    try {
      await updateCategory(category.id, { name });
      queryClient.invalidateQueries({ queryKey: ['categories', menuId] });
      showToast('Категория обновлена ✓', 'success');
      setEditCatOpen(false);
    } catch {
      showToast('Ошибка: не удалось обновить', 'error');
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    try {
      await deleteCategory(category.id);
      queryClient.invalidateQueries({ queryKey: ['categories', menuId] });
      showToast('Категория удалена', 'success');
    } catch {
      showToast('Ошибка: не удалось удалить', 'error');
    } finally {
      setConfirmDel(false);
    }
  };

  return (
    <>
      <div style={{ background: 'var(--cream-bg)', border: '0.5px solid var(--cream-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', marginBottom: 16, overflow: 'hidden' }}>
        {/* Category header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '0.5px solid var(--cream-border)', gap: 10 }}>
          <div {...dragHandleProps} style={{ cursor: 'grab', color: 'var(--ink-tertiary)', fontSize: 16, flexShrink: 0, userSelect: 'none' }}>⠿</div>
          <div style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--ink-primary)' }}>
            {category.name}
          </div>
          <span style={{ fontSize: 11, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-ui)' }}>
            {items.length} блюд
          </span>
          <button onClick={() => setEditCatOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--ink-tertiary)', padding: 4 }} title="Редактировать">✏️</button>
          <button onClick={() => setConfirmDel(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--error-text)', padding: 4 }} title="Удалить">🗑</button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div style={{ padding: '16px 24px' }}>
            <EmptyState icon="🍽️" title="Нет блюд" description="Добавьте первое блюдо в эту категорию" />
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {items.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  categoryId={category.id}
                  menuId={menuId}
                  onEdit={handleEditItem}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}

        {/* Add item footer */}
        <div style={{ padding: '10px 16px', borderTop: items.length > 0 ? '0.5px solid var(--cream-border)' : 'none' }}>
          <button
            onClick={() => { setEditingItem(undefined); setItemFormOpen(true); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span style={{ fontSize: 16 }}>+</span>
            <span>Добавить блюдо</span>
          </button>
        </div>
      </div>

      <ItemFormModal
        isOpen={itemFormOpen}
        item={editingItem}
        categories={allCategories}
        defaultCategoryId={category.id}
        onSave={handleSaveItem}
        onCancel={() => { setItemFormOpen(false); setEditingItem(undefined); }}
        loading={itemSaving}
      />

      <CategoryFormModal
        isOpen={editCatOpen}
        initialName={category.name}
        onSave={handleSaveCategory}
        onCancel={() => setEditCatOpen(false)}
        loading={catSaving}
      />

      <ConfirmModal
        isOpen={confirmDel}
        title="Удалить категорию?"
        message={`Категория "${category.name}" и все блюда в ней будут удалены.`}
        onConfirm={handleDeleteCategory}
        onCancel={() => setConfirmDel(false)}
        danger
      />
    </>
  );
}
