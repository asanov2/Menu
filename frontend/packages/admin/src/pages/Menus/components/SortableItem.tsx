// === FILE: frontend/packages/admin/src/pages/Menus/components/SortableItem.tsx ===
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { MenuItem } from '@qrmenu/ui';
import ItemRow from './ItemRow';

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
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        background: isDragging ? 'var(--cream-muted)' : 'transparent',
        boxShadow: isDragging ? 'var(--shadow-card)' : 'none',
        scale: isDragging ? '1.01' : '1',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        {...attributes}
        {...listeners}
        style={{
          padding: '0 8px',
          cursor: 'grab',
          color: 'var(--ink-tertiary)',
          fontSize: 14,
          flexShrink: 0,
          userSelect: 'none',
        }}
        title="Перетащить"
      >
        ⠿
      </div>
      <div style={{ flex: 1 }}>
        <ItemRow item={item} categoryId={categoryId} menuId={menuId} onEdit={onEdit} />
      </div>
    </div>
  );
}
