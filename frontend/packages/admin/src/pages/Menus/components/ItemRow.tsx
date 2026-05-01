// === FILE: frontend/packages/admin/src/pages/Menus/components/ItemRow.tsx ===
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatPrice, useToast, ConfirmModal } from '@qrmenu/ui';
import type { MenuItem } from '@qrmenu/ui';
import { toggleAvailable, deleteItem } from '../../../api/items';

interface ItemRowProps {
  item: MenuItem;
  categoryId: string;
  menuId: string;
  onEdit: (item: MenuItem) => void;
}

export default function ItemRow({ item, categoryId, menuId, onEdit }: ItemRowProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [optimisticAvailable, setOptimisticAvailable] = useState(item.is_available);
  const [toggling, setToggling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleToggle = async () => {
    if (toggling) return;
    const prev = optimisticAvailable;
    setOptimisticAvailable(!prev);
    setToggling(true);
    try {
      await toggleAvailable(item.id);
      queryClient.invalidateQueries({ queryKey: ['categories', menuId] });
    } catch {
      setOptimisticAvailable(prev);
      showToast('Ошибка: не удалось изменить статус', 'error');
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteItem(item.id);
      queryClient.invalidateQueries({ queryKey: ['categories', menuId] });
      showToast('Блюдо удалено', 'success');
    } catch {
      showToast('Ошибка: не удалось удалить', 'error');
    } finally {
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '36px 1fr 80px 50px 32px 32px',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderBottom: '0.5px solid var(--cream-border)',
        }}
      >
        {/* Image */}
        {item.image_url ? (
          <img src={item.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', objectFit: 'cover', display: 'block', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--cream-muted)', flexShrink: 0 }} />
        )}

        {/* Name */}
        <div style={{ fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-ui)', color: optimisticAvailable ? 'var(--ink-primary)' : 'var(--ink-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </div>

        {/* Price */}
        <div style={{ fontSize: 12, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)' }}>
          {formatPrice(item.price)}
        </div>

        {/* Toggle */}
        <div
          onClick={handleToggle}
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            background: optimisticAvailable ? 'var(--accent-gold)' : 'var(--cream-border)',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 2,
              left: optimisticAvailable ? 'calc(100% - 18px)' : 2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'white',
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        </div>

        {/* Edit */}
        <button
          onClick={() => onEdit(item)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--ink-tertiary)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Редактировать"
        >
          ✏️
        </button>

        {/* Delete */}
        <button
          onClick={() => setConfirmDelete(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--error-text)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Удалить"
        >
          🗑
        </button>
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        title="Удалить блюдо?"
        message={`Блюдо "${item.name}" будет удалено безвозвратно.`}
        confirmText="Удалить"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        danger
      />
    </>
  );
}
