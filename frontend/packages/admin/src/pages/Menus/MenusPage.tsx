// === FILE: frontend/packages/admin/src/pages/Menus/MenusPage.tsx ===
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EmptyState, Skeleton, useToast, Icon } from '@qrmenu/ui';
import { getMenus, createMenu } from '../../api/menus';
import MenuCard from './components/MenuCard';
import PlanLimitModal from '../../components/PlanLimitModal';
import { isPlanLimitError, getPlanLimitDetail } from '../../utils/planLimitError';
import type { PlanLimitDetail } from '../../utils/planLimitError';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './MenusPage.module.css';
import common from '../../styles/common.module.css';

export default function MenusPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLang, setNewLang] = useState('ru');
  const [saving, setSaving] = useState(false);
  const [planLimitDetail, setPlanLimitDetail] = useState<PlanLimitDetail | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: getMenus,
  });

  const menus = data?.menus ?? [];
  const usage = data?.usage;
  const atMenusLimit = usage != null && usage.menus_limit != null && usage.menus_used >= usage.menus_limit;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createMenu({ name: newName.trim(), language: newLang });
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      showToast('Меню создано', 'success');
      setCreateOpen(false);
      setNewName('');
      setNewLang('ru');
    } catch (err: unknown) {
      if (isPlanLimitError(err)) {
        setCreateOpen(false);
        setPlanLimitDetail(getPlanLimitDetail(err));
      } else {
        showToast('Ошибка: не удалось создать меню', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className={common.pageHeader}>
        <h1 className={styles.pageTitle}>Мои меню</h1>
        <button
          onClick={() => !atMenusLimit && setCreateOpen(true)}
          className={`${styles.btnCreate} ${atMenusLimit ? styles.btnCreateDisabled : ''}`}
          disabled={atMenusLimit}
          title={atMenusLimit ? `Лимит: ${usage?.menus_used}/${usage?.menus_limit} меню` : undefined}
        >
          + Создать меню
        </button>
      </div>

      {/* Usage bar */}
      {usage && usage.menus_limit != null && (
        <div className={styles.usageBar}>
          <div className={styles.usageText}>
            Меню: {usage.menus_used} из {usage.menus_limit}
          </div>
          <div className={styles.usageTrack}>
            <div
              className={`${styles.usageFill} ${atMenusLimit ? styles.usageFillFull : ''}`}
              style={{ width: `${Math.min((usage.menus_used / usage.menus_limit) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height="180px" borderRadius="var(--radius-lg)" />)}
        </div>
      ) : !menus.length ? (
        <EmptyState
          icon={<Icon name="tools-kitchen-2" size={40} />}
          title="Нет меню"
          description="Создайте первое меню для вашего ресторана"
          action={
            <button onClick={() => setCreateOpen(true)} className={styles.btnEmpty}>
              Создать меню
            </button>
          }
        />
      ) : (
        <div className={styles.grid}>
          {menus.map((menu) => <MenuCard key={menu.id} menu={menu} itemCount={menu.items_count} />)}
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
              className={styles.backdrop}
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className={styles.modal}
              style={{ transform: 'translate(-50%, -50%)' }}
            >
              <div className={styles.modalTitle}>Новое меню</div>
              <div className={styles.modalForm}>
                <div>
                  <div className={styles.fieldLabel}>Название *</div>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Основное меню"
                    className={styles.input}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                  />
                </div>
                <div>
                  <div className={styles.fieldLabel}>Язык</div>
                  <select
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value)}
                    className={styles.input}
                  >
                    <option value="ru">Русский (RU)</option>
                    <option value="kz">Казахский (KZ)</option>
                    <option value="en">English (EN)</option>
                  </select>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button onClick={() => setCreateOpen(false)} className={styles.btnCancel}>Отмена</button>
                <button
                  onClick={handleCreate}
                  disabled={saving || !newName.trim()}
                  className={`${styles.btnSubmit} ${(saving || !newName.trim()) ? styles.btnSubmitDisabled : ''}`}
                >
                  {saving ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <PlanLimitModal detail={planLimitDetail} onClose={() => setPlanLimitDetail(null)} />
    </div>
  );
}
