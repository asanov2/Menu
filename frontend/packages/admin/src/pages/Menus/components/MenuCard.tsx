// === FILE: frontend/packages/admin/src/pages/Menus/components/MenuCard.tsx ===
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmModal, useToast } from '@qrmenu/ui';
import type { Menu } from '@qrmenu/ui';
import { deleteMenu, updateMenu } from '../../../api/menus';

interface MenuCardProps {
  menu: Menu;
  itemCount?: number;
}

const LANG_LABEL: Record<string, string> = { ru: 'RU', kz: 'KZ', en: 'EN' };

export default function MenuCard({ menu, itemCount = 0 }: MenuCardProps) {
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
      <div
        style={{
          background: 'var(--cream-bg)',
          border: '0.5px solid var(--cream-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          position: 'relative',
          transition: 'box-shadow 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-modal)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)'; }}
      >
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editName ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditName(false); }}
                  autoFocus
                  style={{ flex: 1, background: 'var(--cream-surface)', border: '0.5px solid var(--accent-gold)', borderRadius: 'var(--radius-md)', padding: '4px 8px', fontSize: 14, fontFamily: 'var(--font-ui)', outline: 'none' }}
                />
                <button onClick={handleRename} style={{ background: 'var(--ink-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>✓</button>
              </div>
            ) : (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--ink-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {menu.name}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--cream-muted)', border: '0.5px solid var(--cream-border)', fontSize: 10, fontFamily: 'var(--font-ui)', color: 'var(--ink-secondary)' }}>
                {LANG_LABEL[menu.language] ?? menu.language}
              </span>
              {menu.is_default && (
                <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--tag-green-bg)', border: '0.5px solid var(--tag-green-border)', fontSize: 10, fontFamily: 'var(--font-ui)', color: 'var(--tag-green-text)' }}>
                  По умолчанию
                </span>
              )}
            </div>
          </div>

          {/* Three-dot menu */}
          <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--ink-tertiary)', padding: '2px 6px', lineHeight: 1 }}
            >
              ⋯
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: 28, background: 'var(--cream-surface)', border: '0.5px solid var(--cream-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)', zIndex: 10, minWidth: 140, overflow: 'hidden' }}>
                <button onClick={() => { setEditName(true); setMenuOpen(false); }} style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-ui)', color: 'var(--ink-primary)' }}>
                  ✏️ Переименовать
                </button>
                <button onClick={() => { setConfirmDel(true); setMenuOpen(false); }} style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-ui)', color: 'var(--error-text)' }}>
                  🗑 Удалить
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Item count */}
        <div style={{ fontSize: 13, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)' }}>
          {itemCount} {itemCount === 1 ? 'блюдо' : itemCount < 5 ? 'блюда' : 'блюд'}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate(`/menus/${menu.id}`)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid var(--ink-primary)', color: 'var(--ink-primary)', fontSize: 13, fontFamily: 'var(--font-ui)', cursor: 'pointer', fontWeight: 500 }}
          >
            Открыть
          </button>
          <button
            onClick={() => navigate(`/menus/${menu.id}/qr`)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '0.5px solid var(--cream-border)', color: 'var(--ink-secondary)', fontSize: 13, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}
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
