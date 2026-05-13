import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { createItem, getItems, updateItem, reorderItems } from '../../../api/items';
import SortableItem from './SortableItem';
import ItemFormModal from './ItemFormModal';
import CategoryFormModal from './CategoryFormModal';
import { updateCategory } from '../../../api/categories';
import styles from './CategorySection.module.css';

interface CategorySectionProps {
  category: Category;
  allCategories: Category[];
  menuId: string;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export default function CategorySection({ category, allCategories, menuId, dragHandleProps }: CategorySectionProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: items = [] } = useQuery<MenuItem[]>({
    queryKey: ['items', category.id],
    queryFn: () => getItems(category.id),
  });
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
    try {
      await reorderItems(reordered.map((item, idx) => ({ id: item.id, sort_order: idx })));
      queryClient.invalidateQueries({ queryKey: ['items', category.id] });
    } catch {
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
        await createItem({ ...data, name: data.name!, price: data.price! });
        showToast('Блюдо добавлено ✓', 'success');
      }
      queryClient.invalidateQueries({ queryKey: ['items', category.id] });
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
      <div className={styles.card}>
        {/* Category header */}
        <div className={styles.header}>
          <div {...dragHandleProps} className={styles.dragHandle}>⠿</div>
          <div className={styles.catName}>
            {category.name}
          </div>
          <span className={styles.itemCount}>
            {items.length} блюд
          </span>
          <button onClick={() => setEditCatOpen(true)} className={styles.editBtn} title="Редактировать">✏️</button>
          <button onClick={() => setConfirmDel(true)} className={styles.deleteBtn} title="Удалить">🗑</button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className={styles.emptyWrapper}>
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
        <div className={`${styles.footer} ${items.length > 0 ? styles.footerBordered : ''}`}>
          <button
            onClick={() => { setEditingItem(undefined); setItemFormOpen(true); }}
            className={styles.addBtn}
          >
            <span className={styles.addBtnPlus}>+</span>
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
