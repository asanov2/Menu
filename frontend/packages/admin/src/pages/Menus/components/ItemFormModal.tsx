// === FILE: frontend/packages/admin/src/pages/Menus/components/ItemFormModal.tsx ===
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import type { MenuItem, Category } from '@qrmenu/ui';
import ImageUpload from './ImageUpload';

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле').max(100),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0, 'Минимум 0'),
  category_id: z.string().min(1),
  preparation_time: z.coerce.number().min(1).max(180).optional().or(z.literal('')).transform(v => v === '' ? undefined : Number(v)),
  tags: z.array(z.string()),
  is_available: z.boolean(),
  image_url: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const ALL_TAGS = ['Популярное', 'Веган', 'Острое', 'Новое', 'Шеф рекомендует'];

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

interface ItemFormModalProps {
  isOpen: boolean;
  item?: MenuItem;
  categories: Category[];
  defaultCategoryId?: string;
  onSave: (data: Partial<MenuItem> & { category_id: string }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ItemFormModal({ isOpen, item, categories, defaultCategoryId, onSave, onCancel, loading }: ItemFormModalProps) {
  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category_id: defaultCategoryId ?? '',
      tags: [],
      is_available: true,
      image_url: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: item?.name ?? '',
        description: item?.description ?? '',
        price: item?.price ?? 0,
        category_id: item ? '' : (defaultCategoryId ?? ''),
        preparation_time: item?.preparation_time ?? undefined,
        tags: item?.tags ?? [],
        is_available: item?.is_available ?? true,
        image_url: item?.image_url ?? '',
      });
    }
  }, [isOpen, item, defaultCategoryId, reset]);

  const tags = watch('tags');
  const isAvailable = watch('is_available');

  const toggleTag = (tag: string) => {
    const current = tags ?? [];
    if (current.includes(tag)) {
      setValue('tags', current.filter((t) => t !== tag));
    } else {
      setValue('tags', [...current, tag]);
    }
  };

  const onSubmit = async (data: FormData) => {
    await onSave(data as Partial<MenuItem> & { category_id: string });
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
            style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.45)', backdropFilter: 'blur(4px)', zIndex: 300 }}
          />
          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 420,
              maxWidth: '100vw',
              background: '#FDFAF5',
              boxShadow: 'var(--shadow-modal)',
              zIndex: 301,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            <div style={{ padding: '24px 24px 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink-primary)' }}>
                  {item ? 'Редактировать блюдо' : 'Новое блюдо'}
                </div>
                <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--ink-tertiary)', padding: 4 }}>✕</button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ flex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Image */}
              <Controller
                name="image_url"
                control={control}
                render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} />}
              />

              {/* Name */}
              <div>
                <input {...register('name')} placeholder="Название блюда" style={{ ...inputStyle, borderColor: errors.name ? 'var(--error-text)' : 'var(--cream-border)' }} onFocus={(e) => { e.target.style.borderColor = 'var(--accent-gold)'; }} onBlur={(e) => { e.target.style.borderColor = 'var(--cream-border)'; }} />
                {errors.name && <div style={{ fontSize: 11, color: 'var(--error-text)', marginTop: 3, fontFamily: 'var(--font-ui)' }}>{errors.name.message}</div>}
              </div>

              {/* Description */}
              <textarea
                {...register('description')}
                placeholder="Описание (необязательно)"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent-gold)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--cream-border)'; }}
              />

              {/* Price + Prep time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', marginBottom: 4 }}>Цена ₸</div>
                  <input {...register('price')} type="number" min={0} step="0.01" placeholder="0" style={inputStyle} onFocus={(e) => { e.target.style.borderColor = 'var(--accent-gold)'; }} onBlur={(e) => { e.target.style.borderColor = 'var(--cream-border)'; }} />
                  {errors.price && <div style={{ fontSize: 11, color: 'var(--error-text)', marginTop: 3, fontFamily: 'var(--font-ui)' }}>{errors.price.message}</div>}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', marginBottom: 4 }}>Время приг. (мин)</div>
                  <input {...register('preparation_time')} type="number" min={1} max={180} placeholder="—" style={inputStyle} onFocus={(e) => { e.target.style.borderColor = 'var(--accent-gold)'; }} onBlur={(e) => { e.target.style.borderColor = 'var(--cream-border)'; }} />
                </div>
              </div>

              {/* Category */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', marginBottom: 4 }}>Категория</div>
                <select {...register('category_id')} style={{ ...inputStyle, appearance: 'none' }}>
                  <option value="">Выберите категорию</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Tags */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', marginBottom: 8 }}>Теги</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ALL_TAGS.map((tag) => {
                    const sel = tags?.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        style={{
                          padding: '4px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: sel ? 'none' : '0.5px solid var(--cream-border)',
                          background: sel ? 'var(--ink-primary)' : 'white',
                          color: sel ? 'var(--cream-bg)' : 'var(--ink-secondary)',
                          fontSize: 12,
                          fontFamily: 'var(--font-ui)',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Available toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  onClick={() => setValue('is_available', !isAvailable)}
                  style={{
                    width: 36, height: 20, borderRadius: 10,
                    background: isAvailable ? 'var(--accent-gold)' : 'var(--cream-border)',
                    position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  <div style={{ position: 'absolute', top: 2, left: isAvailable ? 'calc(100% - 18px)' : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-ui)', color: 'var(--ink-secondary)' }}>
                  В наличии
                </span>
              </div>

              <div style={{ height: 24 }} />
            </form>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '0.5px solid var(--cream-border)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0, background: '#FDFAF5' }}>
              <button type="button" onClick={onCancel} style={{ padding: '9px 18px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid var(--ink-primary)', color: 'var(--ink-primary)', fontSize: 13, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={loading}
                style={{ padding: '9px 18px', borderRadius: 'var(--radius-md)', background: 'var(--ink-primary)', color: 'var(--cream-bg)', border: 'none', fontSize: 13, fontFamily: 'var(--font-ui)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {loading && <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />}
                Сохранить
              </button>
            </div>
          </motion.div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </AnimatePresence>
  );
}
