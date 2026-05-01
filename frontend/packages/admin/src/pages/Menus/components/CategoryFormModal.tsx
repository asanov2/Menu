// === FILE: frontend/packages/admin/src/pages/Menus/components/CategoryFormModal.tsx ===
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

const schema = z.object({ name: z.string().min(1, 'Обязательное поле').max(80) });
type FormData = z.infer<typeof schema>;

interface CategoryFormModalProps {
  isOpen: boolean;
  initialName?: string;
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'white',
  border: '0.5px solid var(--cream-border)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 12px',
  fontSize: 13,
  fontFamily: 'var(--font-ui)',
  outline: 'none',
  boxSizing: 'border-box',
};

export default function CategoryFormModal({ isOpen, initialName, onSave, onCancel, loading }: CategoryFormModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isOpen) reset({ name: initialName ?? '' });
  }, [isOpen, initialName, reset]);

  const onSubmit = async (data: FormData) => {
    await onSave(data.name);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.45)', backdropFilter: 'blur(4px)', zIndex: 200 }}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 48px)',
              maxWidth: 360,
              background: '#FDFAF5',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              zIndex: 201,
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink-primary)', marginBottom: 18 }}>
              {initialName ? 'Редактировать категорию' : 'Новая категория'}
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <input
                {...register('name')}
                placeholder="Название категории"
                style={{ ...inputStyle, borderColor: errors.name ? 'var(--error-text)' : 'var(--cream-border)' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent-gold)'; }}
                onBlur={(e) => { e.target.style.borderColor = errors.name ? 'var(--error-text)' : 'var(--cream-border)'; }}
                autoFocus
              />
              {errors.name && <div style={{ fontSize: 11, color: 'var(--error-text)', marginTop: 4, fontFamily: 'var(--font-ui)' }}>{errors.name.message}</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button type="button" onClick={onCancel} style={{ padding: '9px 18px', borderRadius: 'var(--radius-md)', background: 'var(--cream-muted)', border: '0.5px solid var(--cream-border)', color: 'var(--ink-secondary)', fontSize: 13, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>
                  Отмена
                </button>
                <button type="submit" disabled={loading} style={{ padding: '9px 18px', borderRadius: 'var(--radius-md)', background: 'var(--ink-primary)', color: 'var(--cream-bg)', border: 'none', fontSize: 13, fontFamily: 'var(--font-ui)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
