// === FILE: frontend/packages/admin/src/pages/Menus/components/MenuCard.tsx ===
import { useState, useRef, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmModal, useToast } from '@qrmenu/ui';
import type { Menu } from '@qrmenu/ui';
import { deleteMenu, updateMenu } from '../../../api/menus';
import styles from './MenuCard.module.css';

interface MenuCardProps {
  menu: Menu;
  itemCount?: number;
}

const LANG_LABEL: Record<string, string> = { ru: 'RU', kz: 'KZ', en: 'EN' };

function MenuCard({ menu, itemCount = 0 }: MenuCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [editName, setEditName] = useState(false);
  const [nameValue, setNameValue] = useState(menu.name);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDelete = async () => {
    try {
      await deleteMenu(menu.id);
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      showToast('Меню удалено', 'success');
    } catch {
      showToast('Ошибка: не удалось удалить', 'error');
    } finally {
      setConfirmDel(false);
    }
  };

  const handleRename = async () => {
    if (!nameValue.trim()) return;
    try {
      await updateMenu(menu.id, { name: nameValue.trim() });
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      showToast('Название обновлено ✓', 'success');
    } catch {
      showToast('Ошибка: не удалось обновить', 'error');
    } finally {
      setEditName(false);
    }
  };

  return (
    <>
      <div className={styles.card}>
        {/* Top row */}
        {editName ? (
          <div className={styles.editRow}>
            <input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') { setEditName(false); setNameValue(menu.name); }
              }}
              autoFocus
              className={styles.nameInput}
            />
            <button onClick={handleRename} className={styles.saveBtn}>
              ✓ Сохранить
            </button>
            <button
              onClick={() => { setEditName(false); setNameValue(menu.name); }}
              className={styles.cancelEditBtn}
            >
              ✕
            </button>
          </div>
        ) : (
          <div className={styles.nameRow}>
            <div className={styles.nameContent}>
              <div className={styles.menuName}>
                {menu.name}
              </div>
              <div className={styles.badgesRow}>
                <span className={styles.langBadge}>
                  {LANG_LABEL[menu.language] ?? menu.language}
                </span>
                {menu.is_default && (
                  <span className={styles.defaultBadge}>
                    По умолчанию
                  </span>
                )}
              </div>
            </div>

            {/* Three-dot menu — скрывается при редактировании */}
            <div ref={menuRef} className={styles.menuActionsRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className={styles.dotBtn}
              >
                ⋯
              </button>
              {menuOpen && (
                <div className={styles.dropdown}>
                  <button
                    onClick={() => { setEditName(true); setMenuOpen(false); }}
                    className={styles.dropdownItem}
                  >
                    ✏️ Переименовать
                  </button>
                  <button
                    onClick={() => { setConfirmDel(true); setMenuOpen(false); }}
                    className={`${styles.dropdownItem} ${styles.dropdownItemDelete}`}
                  >
                    🗑 Удалить
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Item count */}
        <div className={styles.itemCount}>
          {itemCount} {itemCount === 1 ? 'блюдо' : itemCount < 5 ? 'блюда' : 'блюд'}
        </div>

        {/* Buttons */}
        <div className={styles.actionsRow}>
          <button
            onClick={() => navigate(`/menus/${menu.id}`)}
            className={styles.btnOpen}
          >
            Открыть
          </button>
          <button
            onClick={() => navigate(`/menus/${menu.id}/qr`)}
            className={styles.btnQr}
          >
            QR-код
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDel}
        title="Удалить меню?"
        message={`Меню "${menu.name}" будет удалено безвозвратно.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDel(false)}
        danger
      />
    </>
  );
}

export default memo(MenuCard);
