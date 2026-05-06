import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { INPUT_STYLE, useInputFocus, Z_INDEX, ANIMATION, FormField } from '@qrmenu/ui';

const schema = z.object({ name: z.string().min(1, 'Обязательное поле').max(80) });
type FormData = z.infer<typeof schema>;

interface CategoryFormModalProps {
  isOpen: boolean;
  initialName?: string;
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function CategoryFormModal({ isOpen, initialName, onSave, onCancel, loading }: CategoryFormModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const nameFocus = useInputFocus(!!errors.name);

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
            transition={{ duration: ANIMATION.fadeMs }}
            onClick={onCancel}
            style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.5)', backdropFilter: 'blur(4px)', zIndex: Z_INDEX.modal }}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={ANIMATION.spring}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 48px)',
              maxWidth: 360,
              background: 'var(--cream-bg)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              zIndex: Z_INDEX.modalInner,
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink-primary)', marginBottom: 18 }}>
              {initialName ? 'Редактировать категорию' : 'Новая категория'}
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <FormField label="Название категории" error={errors.name?.message} required>
                <input
                  {...register('name')}
                  {...nameFocus}
                  placeholder="Название категории"
                  autoFocus
                  style={{ ...INPUT_STYLE, borderColor: errors.name ? 'var(--error-text)' : 'var(--cream-border)' }}
                />
              </FormField>
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
