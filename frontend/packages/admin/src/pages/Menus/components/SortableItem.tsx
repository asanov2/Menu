// === FILE: frontend/packages/admin/src/pages/Menus/components/SortableItem.tsx ===
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { MenuItem } from '@qrmenu/ui';
import ItemRow from './ItemRow';
import styles from './SortableItem.module.css';

interface SortableItemProps {
  item: MenuItem;
  categoryId: string;
  menuId: string;
  onEdit: (item: MenuItem) => void;
}

export default function SortableItem({ item, categoryId, menuId, onEdit }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.wrapper} ${isDragging ? styles.wrapperDragging : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div
        {...attributes}
        {...listeners}
        className={styles.dragHandle}
        title="Перетащить"
      >
        ⠿
      </div>
      <div className={styles.itemWrapper}>
        <ItemRow item={item} categoryId={categoryId} menuId={menuId} onEdit={onEdit} />
      </div>
    </div>
  );
}
