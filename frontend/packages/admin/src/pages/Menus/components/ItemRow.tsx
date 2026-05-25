import { useState, memo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatPrice, useToast, ConfirmModal, getImageObjectPosition, getCleanImageUrl, Icon } from '@qrmenu/ui';
import type { MenuItem } from '@qrmenu/ui';
import { toggleAvailable, deleteItem } from '../../../api/items';
import { useAuth } from '../../../hooks/useAuth';
import { isPlanLimitError, getPlanLimitDetail } from '../../../utils/planLimitError';
import type { PlanLimitDetail } from '../../../utils/planLimitError';
import PlanLimitModal from '../../../components/PlanLimitModal';
import styles from './ItemRow.module.css';

interface ItemRowProps {
  item: MenuItem;
  categoryId: string;
  menuId: string;
  onEdit: (item: MenuItem) => void;
  dragHandle?: React.ReactNode;
}

function ItemRow({ item, categoryId, menuId, onEdit, dragHandle }: ItemRowProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { restaurant } = useAuth();
  const [optimisticAvailable, setOptimisticAvailable] = useState(item.is_available);
  const [toggling, setToggling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [planLimitDetail, setPlanLimitDetail] = useState<PlanLimitDetail | null>(null);

  const handleToggle = async () => {
    if (toggling) return;

    if (restaurant?.plan === 'starter') {
      setPlanLimitDetail({
        code: 'PLAN_LIMIT_REACHED',
        message: 'Стоп-лист доступен только на тарифе Бизнес и выше.',
        upgrade_to: 'business',
      });
      return;
    }

    const prev = optimisticAvailable;
    setOptimisticAvailable(!prev);
    setToggling(true);
    try {
      await toggleAvailable(item.id);
      queryClient.invalidateQueries({ queryKey: ['categories', menuId] });
    } catch (err: unknown) {
      setOptimisticAvailable(prev);
      if (isPlanLimitError(err)) {
        setPlanLimitDetail(getPlanLimitDetail(err));
      } else {
        showToast('Ошибка: не удалось изменить статус', 'error');
      }
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
        {/*
          rowTop и rowBottom — на десктопе два flex-блока внутри .row.
          На мобильном display:contents делает их "прозрачными":
          все дочерние элементы становятся прямыми flex-children .row,
          образуя одну горизонтальную строку.
        */}
        <div className={styles.rowTop}>
          {dragHandle && (
            <div className={styles.dragHandleWrap}>{dragHandle}</div>
          )}

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

          {/* nameBlock: name + price вертикально на мобильном, горизонтально на десктопе */}
          <div className={styles.nameBlock}>
            <div className={`${styles.name} ${!optimisticAvailable ? styles.nameUnavailable : ''}`}>
              {item.name}
            </div>
            <div className={styles.price}>
              {formatPrice(item.price)}
            </div>
          </div>
        </div>

        <div className={styles.rowBottom}>
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

          <button
            onClick={() => onEdit(item)}
            className={styles.actionBtn}
            title="Редактировать"
          >
            <Icon name="pencil" size={15} />
          </button>

          <button
            onClick={() => setConfirmDelete(true)}
            className={styles.deleteBtn}
            title="Удалить"
          >
            <Icon name="trash" size={15} />
          </button>
        </div>
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

      <PlanLimitModal detail={planLimitDetail} onClose={() => setPlanLimitDetail(null)} />
    </>
  );
}

export default memo(ItemRow);
