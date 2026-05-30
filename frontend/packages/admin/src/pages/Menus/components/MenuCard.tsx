// === FILE: frontend/packages/admin/src/pages/Menus/components/MenuCard.tsx ===
import { useState, useRef, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { ConfirmModal, useToast, Icon } from '@qrmenu/ui';
import type { Menu } from '@qrmenu/ui';
import { deleteMenu, updateMenu, updateMenuOrderSettings } from '../../../api/menus';
import { useAuth } from '../../../hooks/useAuth';
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
  const { restaurant } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [editName, setEditName] = useState(false);
  const [nameValue, setNameValue] = useState(menu.name);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [orderSettings, setOrderSettings] = useState({
    orders_enabled: menu.orders_enabled ?? false,
    preorders_enabled: menu.preorders_enabled ?? false,
    tables_count: menu.tables_count ?? 10,
  });
  const [tablesRaw, setTablesRaw] = useState(String(menu.tables_count ?? 10));
  const menuRef = useRef<HTMLDivElement>(null);
  const isBusiness = restaurant?.plan === 'business' || restaurant?.plan === 'pro';

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
      showToast('Название обновлено', 'success');
    } catch {
      showToast('Ошибка: не удалось обновить', 'error');
    } finally {
      setEditName(false);
    }
  };

  const orderSettingsMutation = useMutation({
    mutationFn: () => updateMenuOrderSettings(menu.id, orderSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      showToast('Настройки заказа сохранены', 'success');
    },
    onError: () => showToast('Ошибка сохранения настроек', 'error'),
  });

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
              <Icon name="check" size={14} /> Сохранить
            </button>
            <button
              onClick={() => { setEditName(false); setNameValue(menu.name); }}
              className={styles.cancelEditBtn}
            >
              <Icon name="x" size={14} />
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
                    <Icon name="pencil" size={14} /> Переименовать
                  </button>
                  <button
                    onClick={() => { setConfirmDel(true); setMenuOpen(false); }}
                    className={`${styles.dropdownItem} ${styles.dropdownItemDelete}`}
                  >
                    <Icon name="trash" size={14} /> Удалить
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
          {isBusiness && (
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className={`${styles.btnSettings} ${settingsOpen ? styles.btnSettingsActive : ''}`}
              title="Настройки заказа"
            >
              <Icon name="settings" size={14} />
            </button>
          )}
        </div>

        {/* Order settings (expandable) */}
        {isBusiness && settingsOpen && (
          <div className={styles.orderSettings}>
            <div className={styles.orderSettingsTitle}>Настройки заказа</div>

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <Icon name="armchair" size={15} />
                <span>Заказ за столом</span>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={orderSettings.orders_enabled}
                  onChange={(e) => setOrderSettings((s) => ({ ...s, orders_enabled: e.target.checked }))}
                />
                <span className={styles.switchTrack} />
              </label>
            </div>

            {orderSettings.orders_enabled && (
              <div className={styles.tablesRow}>
                <Icon name="table" size={14} />
                <label className={styles.tablesLabel}>Столов</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={tablesRaw}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d]/g, '');
                    setTablesRaw(v);
                    if (v !== '') setOrderSettings((s) => ({ ...s, tables_count: Math.max(1, parseInt(v)) }));
                  }}
                  onBlur={() => {
                    const n = Math.max(1, parseInt(tablesRaw) || 1);
                    setTablesRaw(String(n));
                    setOrderSettings((s) => ({ ...s, tables_count: n }));
                  }}
                  className={styles.tablesInput}
                />
              </div>
            )}

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <Icon name="package" size={15} />
                <span>Предзаказ</span>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={orderSettings.preorders_enabled}
                  onChange={(e) => setOrderSettings((s) => ({ ...s, preorders_enabled: e.target.checked }))}
                />
                <span className={styles.switchTrack} />
              </label>
            </div>

            <button
              className={styles.btnSaveSettings}
              onClick={() => orderSettingsMutation.mutate()}
              disabled={orderSettingsMutation.isPending}
            >
              <Icon name="device-floppy" size={14} />
              {orderSettingsMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        )}
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
