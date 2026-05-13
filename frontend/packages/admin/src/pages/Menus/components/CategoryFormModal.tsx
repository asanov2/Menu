import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { INPUT_STYLE, useInputFocus, ANIMATION, FormField } from '@qrmenu/ui';
import styles from './CategoryFormModal.module.css';

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
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: ANIMATION.fadeMs }}
          onClick={onCancel}
          className={styles.backdrop}
        >
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={ANIMATION.spring}
            onClick={(e) => e.stopPropagation()}
            className={styles.panel}
          >
            <div className={styles.title}>
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
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={onCancel}
                  className={styles.btnCancel}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`${styles.btnSubmit} ${loading ? styles.btnSubmitLoading : ''}`}
                >
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
