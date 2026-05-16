import { useEffect, useCallback, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import type { MenuItem, Category } from '@qrmenu/ui';
import { INPUT_STYLE, useInputFocus, ANIMATION, FormField } from '@qrmenu/ui';
import ImageUpload from './ImageUpload';
import styles from './ItemFormModal.module.css';

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
            className={styles.backdrop}
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
            className={styles.panelWrapper}
          >
            {/*
              Inner div — handles snap state + drag offset.
              CSS transition runs on release; none while dragging.
            */}
            <div
              className={`${styles.panel} ${isFullscreen ? styles.panelFullscreen : ''}`}
              style={{
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
                className={`${styles.dragZone} ${isDragging ? styles.dragZoneDragging : ''}`}
              >
                {/* Visual drag handle bar */}
                <div className={`${styles.handle} ${isDragging ? styles.handleDragging : ''}`} />

                {/* Header row — title + buttons */}
                <div className={styles.headerRow}>
                  <div className={styles.headerTitle}>
                    {item ? 'Редактировать блюдо' : 'Новое блюдо'}
                  </div>

                  <div
                    className={styles.headerButtons}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => { setSnapPoint(p => p === 'fullscreen' ? 'default' : 'fullscreen'); setDragY(0); }}
                      title={isFullscreen ? 'Свернуть' : 'На весь экран'}
                      className={styles.headerBtn}
                    >
                      {isFullscreen ? '⊡' : '⊞'}
                    </button>
                    <button
                      type="button"
                      onClick={onCancel}
                      className={`${styles.headerBtn} ${styles.headerBtnClose}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Image upload */}
                <div className={styles.imageWrapper}>
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
                className={styles.formBody}
              >
                <div className={styles.scrollArea}>
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
                      className={styles.textareaField}
                      style={INPUT_STYLE}
                    />
                  </FormField>

                  {/* Price + Prep time */}
                  <div className={styles.priceGrid}>
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
                        className={styles.focusField}
                        style={INPUT_STYLE}
                      />
                    </FormField>
                  </div>

                  {/* Category */}
                  <FormField label="Категория" error={errors.category_id?.message} required>
                    <select
                      id="item-category"
                      {...register('category_id')}
                      {...categoryFocus}
                      className={styles.selectField}
                      style={INPUT_STYLE}
                    >
                      <option value="">Выберите категорию</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </FormField>

                  {/* Tags */}
                  <div>
                    <div className={styles.tagsLabel}>Теги</div>
                    <div className={styles.tagsRow}>
                      {ALL_TAGS.map((tag) => {
                        const sel = tags?.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`${styles.tagBtn} ${sel ? styles.tagBtnSelected : ''}`}
                          >
                            {TAG_LABELS[tag]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Available toggle */}
                  <div className={styles.toggleRow}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isAvailable}
                      onClick={() => setValue('is_available', !isAvailable)}
                      className={`${styles.toggleTrack} ${isAvailable ? styles.toggleTrackOn : ''}`}
                    >
                      <div
                        className={styles.toggleThumb}
                        style={{ left: isAvailable ? 'calc(100% - 18px)' : 2 }}
                      />
                    </button>
                    <span className={styles.toggleLabel}>В наличии</span>
                  </div>
                </div>

                {/* Fixed footer */}
                <div className={styles.footer}>
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
                    {loading && <span className={styles.spinner} />}
                    Сохранить
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
