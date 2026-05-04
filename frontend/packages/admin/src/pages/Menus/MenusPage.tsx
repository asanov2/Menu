// === FILE: frontend/packages/admin/src/pages/Menus/MenusPage.tsx ===
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EmptyState, Skeleton, useToast } from '@qrmenu/ui';
import { getMenus, createMenu } from '../../api/menus';
import MenuCard from './components/MenuCard';
import { motion, AnimatePresence } from 'framer-motion';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--cream-surface)',
  border: '0.5px solid var(--cream-border)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 12px',
  fontSize: 13,
  fontFamily: 'var(--font-ui)',
  outline: 'none',
  boxSizing: 'border-box',
};

export default function MenusPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLang, setNewLang] = useState('ru');
  const [saving, setSaving] = useState(false);

  const { data: menus, isLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: getMenus,
  });

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createMenu({ name: newName.trim(), language: newLang });
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      showToast('Меню создано ✓', 'success');
      setCreateOpen(false);
      setNewName('');
      setNewLang('ru');
    } catch {
      showToast('Ошибка: не удалось создать меню', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ink-primary)', margin: 0 }}>Мои меню</h1>
        <button
          onClick={() => setCreateOpen(true)}
          style={{ padding: '8px 16px', background: 'var(--ink-primary)', color: 'var(--cream-bg)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 500, cursor: 'pointer' }}
        >
          + Создать меню
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height="180px" borderRadius="var(--radius-lg)" />)}
        </div>
      ) : !menus?.length ? (
        <EmptyState
          icon="🍽️"
          title="Нет меню"
          description="Создайте первое меню для вашего ресторана"
          action={
            <button onClick={() => setCreateOpen(true)} style={{ padding: '8px 16px', background: 'var(--ink-primary)', color: 'var(--cream-bg)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>
              Создать меню
            </button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {menus.map((menu) => <MenuCard key={menu.id} menu={menu} />)}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {createOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.45)', backdropFilter: 'blur(4px)', zIndex: 200 }}
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 'calc(100% - 48px)', maxWidth: 360,
                background: 'var(--cream-bg)', borderRadius: 'var(--radius-xl)', padding: 24, zIndex: 201,
                boxShadow: 'var(--shadow-modal)',
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink-primary)', marginBottom: 18 }}>Новое меню</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', marginBottom: 4 }}>Название *</div>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Основное меню"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent-gold)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--cream-border)'; }}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', marginBottom: 4 }}>Язык</div>
                  <select value={newLang} onChange={(e) => setNewLang(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                    <option value="ru">Русский (RU)</option>
                    <option value="kz">Казахский (KZ)</option>
                    <option value="en">English (EN)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button onClick={() => setCreateOpen(false)} style={{ padding: '9px 18px', borderRadius: 'var(--radius-md)', background: 'var(--cream-muted)', border: '0.5px solid var(--cream-border)', color: 'var(--ink-secondary)', fontSize: 13, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>Отмена</button>
                <button onClick={handleCreate} disabled={saving || !newName.trim()} style={{ padding: '9px 18px', borderRadius: 'var(--radius-md)', background: 'var(--ink-primary)', color: 'var(--cream-bg)', border: 'none', fontSize: 13, fontFamily: 'var(--font-ui)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving || !newName.trim() ? 0.6 : 1 }}>
                  {saving ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
