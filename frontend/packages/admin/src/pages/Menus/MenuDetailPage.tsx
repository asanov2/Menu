// === FILE: frontend/packages/admin/src/pages/Menus/MenuDetailPage.tsx ===
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Skeleton, EmptyState, useToast } from '@qrmenu/ui';
import type { Category } from '@qrmenu/ui';
import { getMenu } from '../../api/menus';
import { getCategories, createCategory, reorderCategories } from '../../api/categories';
import CategorySection from './components/CategorySection';
import CategoryFormModal from './components/CategoryFormModal';

function SortableCategory({ category, allCategories, menuId }: { category: Category; allCategories: Category[]; menuId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <CategorySection
        category={category}
        allCategories={allCategories}
        menuId={menuId}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export default function MenuDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [catSaving, setCatSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: menu, isLoading: menuLoading } = useQuery({
    queryKey: ['menu', id],
    queryFn: () => getMenu(id!),
    enabled: !!id,
  });

  const { data: fetchedCategories, isLoading: catsLoading } = useQuery({
    queryKey: ['categories', id],
    queryFn: () => getCategories(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (fetchedCategories) setCategories(fetchedCategories);
  }, [fetchedCategories]);

  const displayCategories = categories.length > 0 ? categories : (fetchedCategories ?? []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = displayCategories.findIndex((c) => c.id === active.id);
    const newIdx = displayCategories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(displayCategories, oldIdx, newIdx);
    setCategories(reordered);
    try {
      await reorderCategories(reordered.map((c, i) => ({ id: c.id, sort_order: i })));
    } catch {
      setCategories(displayCategories);
      showToast('Ошибка сортировки', 'error');
    }
  };

  const handleCreateCategory = async (name: string) => {
    setCatSaving(true);
    try {
      await createCategory({ name, menu_id: id! });
      queryClient.invalidateQueries({ queryKey: ['categories', id] });
      showToast('Категория добавлена ✓', 'success');
      setCatFormOpen(false);
    } catch {
      showToast('Ошибка: не удалось создать категорию', 'error');
    } finally {
      setCatSaving(false);
    }
  };

  if (menuLoading || catsLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton height="28px" width="200px" />
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} height="120px" borderRadius="var(--radius-lg)" />)}
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-ui)', fontSize: 13 }}>
          <Link to="/menus" style={{ color: 'var(--ink-secondary)', textDecoration: 'none' }}>Меню</Link>
          <span style={{ color: 'var(--ink-tertiary)' }}>/</span>
          <span style={{ color: 'var(--ink-primary)', fontWeight: 500 }}>{menu?.name ?? '...'}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href={`https://qrmenu.kz/menu/${menu?.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '0.5px solid var(--cream-border)', color: 'var(--ink-secondary)', fontSize: 13, fontFamily: 'var(--font-ui)', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            👁 Предпросмотр
          </a>
          <button
            onClick={() => setCatFormOpen(true)}
            style={{ padding: '8px 16px', background: 'var(--ink-primary)', color: 'var(--cream-bg)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}
          >
            + Категория
          </button>
        </div>
      </div>

      {/* Categories */}
      {displayCategories.length === 0 ? (
        <EmptyState
          icon="📂"
          title="Нет категорий"
          description="Добавьте первую категорию для организации блюд"
          action={
            <button onClick={() => setCatFormOpen(true)} style={{ padding: '8px 16px', background: 'var(--ink-primary)', color: 'var(--cream-bg)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>
              + Категория
            </button>
          }
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={displayCategories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {displayCategories.map((cat) => (
              <SortableCategory key={cat.id} category={cat} allCategories={displayCategories} menuId={id!} />
            ))}
          </SortableContext>
        </DndContext>
      )}

      <CategoryFormModal
        isOpen={catFormOpen}
        onSave={handleCreateCategory}
        onCancel={() => setCatFormOpen(false)}
        loading={catSaving}
      />
    </div>
  );
}
