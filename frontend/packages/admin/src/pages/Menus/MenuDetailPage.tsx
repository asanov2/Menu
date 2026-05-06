import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Skeleton, EmptyState, useToast } from '@qrmenu/ui';
import type { Category } from '@qrmenu/ui';
import { getMenu } from '../../api/menus';
import { getCategories, createCategory } from '../../api/categories';
import CategorySection from './components/CategorySection';
import CategoryFormModal from './components/CategoryFormModal';
import { useCategoryDnd } from './hooks/useCategoryDnd';

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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const { handleDragEnd } = useCategoryDnd(id!);

  const { data: menu, isLoading: menuLoading } = useQuery({
    queryKey: ['menu', id],
    queryFn: () => getMenu(id!),
    enabled: !!id,
  });

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['categories', id],
    queryFn: () => getCategories(id!),
    enabled: !!id,
  });

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
            href={`${import.meta.env.VITE_APP_URL ?? ''}/menu/${menu?.slug}`}
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
      {categories.length === 0 ? (
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, categories)}>
          <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {categories.map((cat) => (
              <SortableCategory key={cat.id} category={cat} allCategories={categories} menuId={id!} />
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
