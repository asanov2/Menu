import { useEffect, useCallback, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import type { MenuItem, Category } from '@qrmenu/ui';
import { INPUT_STYLE, useInputFocus, Z_INDEX, ANIMATION, FormField } from '@qrmenu/ui';
import ImageUpload from './ImageUpload';

const SNAP_TRANSITION = 'transform 0.42s cubic-bezier(0.32,0.72,0,1), height 0.42s cubic-bezier(0.32,0.72,0,1), border-radius 0.3s ease';

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле').max(100),
  description: z.string().max(500).optional(),
  price: z.coerce.number()
    .positive('Цена должна быть положительной')
    .min(1, 'Минимальная цена 1 ₸')
    .max(9999999, 'Максимальная цена 9 999 999 ₸'),
  category_id: z.string().min(1, 'Выберите категорию'),
  preparation_time: z.coerce.number().min(1).max(180).optional().or(z.literal('')).transform(v => v === '' ? undefined : Number(v)),
  tags: z.array(z.string()),
  is_available: z.boolean(),
  image_url: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const ALL_TAGS = ['popular', 'vegan', 'spicy', 'new', 'chef'] as const;
const TAG_LABELS: Record<string, string> = {
  popular: 'Популярное',
  vegan: 'Веган',
  spicy: 'Острое',
  new: 'Новое',
  chef: 'Шеф рекомендует',
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
  const [snapPoint,  setSnapPoint]  = useState<'default' | 'fullscreen'>('default');
  const [dragY,      setDragY]      = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartClientY = useRef(0);

  const { register, handleSubmit, reset, control, watch, setValue, getValues, formState: { errors } } = useForm<FormData>({
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
      setSnapPoint('default');
      setDragY(0);
      setIsDragging(false);
      reset({
        name: item?.name ?? '',
        description: item?.description ?? '',
        price: item?.price ?? 0,
        category_id: item?.category_id ?? defaultCategoryId ?? '',
        preparation_time: item?.preparation_time ?? undefined,
        tags: item?.tags ?? [],
        is_available: item?.is_available ?? true,
        image_url: item?.image_url ?? '',
      });
    }
  }, [isOpen, item, defaultCategoryId, reset]);

  const tags = watch('tags');
  const isAvailable = watch('is_available');

  const nameFocus     = useInputFocus(!!errors.name);
  const priceFocus    = useInputFocus(!!errors.price);
  const categoryFocus = useInputFocus(!!errors.category_id);

  const toggleTag = useCallback((tag: string) => {
    const current = (getValues('tags') ?? []) as string[];
    setValue('tags', current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag]);
  }, [getValues, setValue]);

  const onSubmit = async (data: FormData) => {
    await onSave(data as Partial<MenuItem> & { category_id: string });
  };

  // ── Drag handle pointer events ──────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartClientY.current = e.clientY;
    setDragY(0);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const delta = e.clientY - dragStartClientY.current;
    setDragY(delta);
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
    setDragY(0);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const delta = e.clientY - dragStartClientY.current;
    const vh = window.innerHeight;

    if (snapPoint === 'default') {
      if (delta < -vh * 0.12) {
        setSnapPoint('fullscreen');
      } else if (delta > vh * 0.15) {
        onCancel();
        return;
      }
    } else {
      if (delta > vh * 0.12) {
        setSnapPoint('default');
      }
    }
    setDragY(0);
  };

  const isFullscreen = snapPoint === 'fullscreen';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: ANIMATION.fadeMs }}
            onClick={onCancel}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(26,18,8,0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: Z_INDEX.modal,
            }}
          />

          {/*
            Outer motion.div — ONLY handles AnimatePresence enter/exit.
            No height, no background — just positioning wrapper.
          */}
          <motion.div
            key="panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: Z_INDEX.modalInner,
              maxWidth: 600,
              margin: '0 auto',
            }}
          >
            {/*
              Inner div — handles snap state + drag offset.
              CSS transition runs on release; none while dragging.
            */}
            <div
              style={{
                height: isFullscreen ? '100dvh' : '92dvh',
                background: 'var(--cream-bg)',
                borderRadius: '20px 20px 0 0',
                boxShadow: 'var(--shadow-modal)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transform: `translateY(${dragY}px)`,
                transition: isDragging ? 'none' : SNAP_TRANSITION,
              }}
            >
              {/* ═══ DRAG ZONE — entire top area is draggable ═══ */}
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                style={{
                  flexShrink: 0,
                  cursor: isDragging ? 'grabbing' : 'grab',
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  paddingTop: 12,
                }}
              >
                {/* Visual drag handle bar */}
                <div style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: isDragging ? 'var(--ink-tertiary)' : 'var(--cream-border)',
                  margin: '0 auto 12px',
                  transition: 'background 0.15s',
                }} />

                {/* Header row — title + buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 20px 16px',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 20,
                    color: 'var(--ink-primary)',
                    fontWeight: 600,
                  }}>
                    {item ? 'Редактировать блюдо' : 'Новое блюдо'}
                  </div>

                  <div
                    style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => { setSnapPoint(p => p === 'fullscreen' ? 'default' : 'fullscreen'); setDragY(0); }}
                      title={isFullscreen ? 'Свернуть' : 'На весь экран'}
                      style={{
                        background: 'var(--cream-muted)',
                        border: '0.5px solid var(--cream-border)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        color: 'var(--ink-secondary)',
                        flexShrink: 0,
                      }}
                    >
                      {isFullscreen ? '⊡' : '⊞'}
                    </button>
                    <button
                      type="button"
                      onClick={onCancel}
                      style={{
                        background: 'var(--cream-muted)',
                        border: '0.5px solid var(--cream-border)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        color: 'var(--ink-secondary)',
                        flexShrink: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Image upload */}
                <div style={{ padding: '0 20px 16px' }}>
                  <Controller
                    name="image_url"
                    control={control}
                    render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} />}
                  />
                </div>
              </div>
              {/* ═══ END DRAG ZONE ═══ */}

              {/* Scrollable form body */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}
              >
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}>
                  {/* Name */}
                  <FormField label="Название блюда" error={errors.name?.message} required>
                    <input
                      id="item-name"
                      {...register('name')}
                      {...nameFocus}
                      placeholder="Название блюда"
                      style={{ ...INPUT_STYLE, borderColor: errors.name ? 'var(--error-text)' : 'var(--cream-border)' }}
                    />
                  </FormField>

                  {/* Description */}
                  <FormField label="Описание">
                    <textarea
                      id="item-description"
                      {...register('description')}
                      placeholder="Описание (необязательно)"
                      rows={3}
                      style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: 72 }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--accent-gold)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'var(--cream-border)'; }}
                    />
                  </FormField>

                  {/* Price + Prep time */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <FormField label="Цена ₸" error={errors.price?.message} required>
                      <input
                        id="item-price"
                        {...register('price')}
                        {...priceFocus}
                        type="number"
                        min={1}
                        max={9999999}
                        step="0.01"
                        placeholder="0"
                        style={INPUT_STYLE}
                      />
                    </FormField>
                    <FormField label="Время приг. (мин)">
                      <input
                        id="item-prep"
                        {...register('preparation_time')}
                        type="number"
                        min={1}
                        max={180}
                        placeholder="—"
                        style={INPUT_STYLE}
                        onFocus={(e) => { e.target.style.borderColor = 'var(--accent-gold)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'var(--cream-border)'; }}
                      />
                    </FormField>
                  </div>

                  {/* Category */}
                  <FormField label="Категория" error={errors.category_id?.message} required>
                    <select
                      id="item-category"
                      {...register('category_id')}
                      {...categoryFocus}
                      style={{ ...INPUT_STYLE, appearance: 'none' }}
                    >
                      <option value="">Выберите категорию</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </FormField>

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
                              background: sel ? 'var(--ink-primary)' : 'var(--cream-surface)',
                              color: sel ? 'var(--cream-bg)' : 'var(--ink-secondary)',
                              fontSize: 12,
                              fontFamily: 'var(--font-ui)',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {TAG_LABELS[tag]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Available toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isAvailable}
                      onClick={() => setValue('is_available', !isAvailable)}
                      style={{ width: 36, height: 20, borderRadius: 10, background: isAvailable ? 'var(--accent-gold)' : 'var(--cream-border)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0, border: 'none', padding: 0 }}
                    >
                      <div style={{ position: 'absolute', top: 2, left: isAvailable ? 'calc(100% - 18px)' : 2, width: 16, height: 16, borderRadius: '50%', background: 'var(--cream-surface)', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </button>
                    <span style={{ fontSize: 13, fontFamily: 'var(--font-ui)', color: 'var(--ink-secondary)' }}>В наличии</span>
                  </div>
                </div>

                {/* Fixed footer */}
                <div style={{
                  flexShrink: 0,
                  padding: '12px 20px',
                  paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
                  borderTop: '0.5px solid var(--cream-border)',
                  display: 'flex',
                  gap: 10,
                  background: 'var(--cream-bg)',
                }}>
                  <button
                    type="button"
                    onClick={onCancel}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'transparent',
                      border: '1px solid var(--cream-border)',
                      color: 'var(--ink-secondary)',
                      fontSize: 14,
                      fontFamily: 'var(--font-ui)',
                      cursor: 'pointer',
                    }}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 2,
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--ink-primary)',
                      color: 'var(--cream-bg)',
                      border: 'none',
                      fontSize: 14,
                      fontFamily: 'var(--font-ui)',
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {loading && (
                      <span style={{
                        width: 14,
                        height: 14,
                        border: '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite',
                        display: 'inline-block',
                      }} />
                    )}
                    Сохранить
                  </button>
                </div>
              </form>
            </div>
          </motion.div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </AnimatePresence>
  );
}
