import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Icon } from '@qrmenu/ui';
import type { Category } from '@qrmenu/ui';
import CategorySection from './CategorySection';
import styles from './SortableCategory.module.css';

interface SortableCategoryProps {
  category: Category;
  allCategories: Category[];
  menuId: string;
}

export default function SortableCategory({ category, allCategories, menuId }: SortableCategoryProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });

  const dragHandle = (
    <div
      {...attributes}
      {...listeners}
      className={styles.dragHandle}
      title="Перетащить"
    >
      <Icon name="grip-vertical" size={16} />
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      className={`${styles.wrapper} ${isDragging ? styles.wrapperDragging : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <CategorySection
        category={category}
        allCategories={allCategories}
        menuId={menuId}
        dragHandle={dragHandle}
      />
    </div>
  );
}
