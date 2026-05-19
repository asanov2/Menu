// === FILE: frontend/packages/admin/src/pages/Menus/components/ItemRow.tsx ===
import { useState, memo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatPrice, useToast, ConfirmModal, getImageObjectPosition, getCleanImageUrl, Icon } from '@qrmenu/ui';
import type { MenuItem } from '@qrmenu/ui';
import { toggleAvailable, deleteItem } from '../../../api/items';
import styles from './ItemRow.module.css';

interface ItemRowProps {
  item: MenuItem;
  categoryId: string;
  menuId: string;
  onEdit: (item: MenuItem) => void;
}

function ItemRow({ item, categoryId, menuId, onEdit }: ItemRowProps) {
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
      <div className={styles.row}>
        {/* Image */}
        {item.image_url ? (
          <img
            src={getCleanImageUrl(item.image_url) ?? undefined}
            alt=""
            className={styles.thumb}
            style={{ objectPosition: getImageObjectPosition(item.image_url) }}
          />
        ) : (
          <div className={styles.thumbPlaceholder} />
        )}

        {/* Name */}
        <div className={`${styles.name} ${!optimisticAvailable ? styles.nameUnavailable : ''}`}>
          {item.name}
        </div>

        {/* Price */}
        <div className={styles.price}>
          {formatPrice(item.price)}
        </div>

        {/* Toggle */}
        <button
          role="switch"
          aria-checked={optimisticAvailable}
          onClick={handleToggle}
          className={`${styles.toggleTrack} ${optimisticAvailable ? styles.toggleTrackOn : ''}`}
        >
          <div
            className={styles.toggleThumb}
            style={{ left: optimisticAvailable ? 'calc(100% - 18px)' : 2 }}
          />
        </button>

        {/* Edit */}
        <button
          onClick={() => onEdit(item)}
          className={styles.actionBtn}
          title="Редактировать"
        >
          <Icon name="pencil" size={15} />
        </button>

        {/* Delete */}
        <button
          onClick={() => setConfirmDelete(true)}
          className={styles.deleteBtn}
          title="Удалить"
        >
          <Icon name="trash" size={15} />
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

export default memo(ItemRow);
