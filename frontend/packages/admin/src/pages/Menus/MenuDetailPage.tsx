import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Skeleton, EmptyState, useToast, Icon } from '@qrmenu/ui';
import { getMenu } from '../../api/menus';
import { getCategories, createCategory } from '../../api/categories';
 import { useAuth } from '../../hooks/useAuth';
import type { PlanLimitDetail } from '../../utils/planLimitError';
import PlanLimitModal from '../../components/PlanLimitModal';
import SortableCategory from './components/SortableCategory';
import CategoryFormModal from './components/CategoryFormModal';
import TranslateMenuModal from './components/TranslateMenuModal';
import { useCategoryDnd } from './hooks/useCategoryDnd';
import styles from './MenuDetailPage.module.css';
import common from '../../styles/common.module.css';

export default function MenuDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { restaurant } = useAuth();
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [catSaving, setCatSaving] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [planLimitDetail, setPlanLimitDetail] = useState<PlanLimitDetail | null>(null);

  const canTranslate =
    restaurant?.plan === 'business' || restaurant?.plan === 'pro';

  const handleTranslateClick = () => {
    if (!canTranslate) {
      setPlanLimitDetail({
        code: 'PLAN_LIMIT_REACHED',
        message: 'AI-перевод меню доступен только на тарифе Бизнес и выше.',
        upgrade_to: 'business',
      });
      return;
    }
    setTranslateOpen(true);
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } }),
  );
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
      showToast('Категория добавлена', 'success');
      setCatFormOpen(false);
    } catch {
      showToast('Ошибка: не удалось создать категорию', 'error');
    } finally {
      setCatSaving(false);
    }
  };

  if (menuLoading || catsLoading) {
    return (
      <div className={styles.loadingSkeleton}>
        <Skeleton height="28px" width="200px" />
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} height="120px" borderRadius="var(--radius-lg)" />)}
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb + actions */}
      <div className={common.pageHeader}>
        <div className={styles.breadcrumb}>
          <Link to="/menus" className={styles.breadcrumbLink}>Меню</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{menu?.name ?? '...'}</span>
        </div>
        <div className={styles.actions}>
          <a
            href={`${import.meta.env.VITE_APP_URL ?? ''}/menu/${restaurant?.slug}?menu_id=${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnPreview}
          >
            <Icon name="eye" size={14} /> Предпросмотр
          </a>
          <button onClick={handleTranslateClick} className={styles.btnTranslate}>
            <Icon name="language" size={14} /> Перевести
          </button>
          <button
            onClick={() => setCatFormOpen(true)}
            className={styles.btnPrimary}
          >
            + Категория
          </button>
        </div>
      </div>

      {/* Categories */}
      {categories.length === 0 ? (
        <EmptyState
          icon={<Icon name="folder-open" size={40} />}
          title="Нет категорий"
          description="Добавьте первую категорию для организации блюд"
          action={
            <button onClick={() => setCatFormOpen(true)} className={styles.btnPrimary}>
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

      <TranslateMenuModal
        menuId={id!}
        isOpen={translateOpen}
        onClose={() => setTranslateOpen(false)}
      />

      <PlanLimitModal detail={planLimitDetail} onClose={() => setPlanLimitDetail(null)} />
    </div>
  );
}
