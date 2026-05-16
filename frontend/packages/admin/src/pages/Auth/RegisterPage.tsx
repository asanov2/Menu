import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast, INPUT_STYLE, FormField } from '@qrmenu/ui';
import { register as registerRestaurant } from '../../api/auth';
import styles from './RegisterPage.module.css';

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);

const schema = z
  .object({
    name: z.string().min(2, 'Минимум 2 символа').max(255),
    slug: z
      .string()
      .min(2, 'Минимум 2 символа')
      .max(100)
      .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Только строчные буквы, цифры и дефисы'),
    email: z.string().email('Введите корректный email'),
    password: z.string().min(8, 'Минимум 8 символов').max(100),
    confirmPassword: z.string(),
    phone: z.string().max(20).optional().or(z.literal('')),
    city: z.string().max(100).optional().or(z.literal('')),
    type: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

const VENUE_TYPES = [
  { value: 'restaurant', label: 'Ресторан' },
  { value: 'cafe',       label: 'Кафе' },
  { value: 'fastfood',   label: 'Фастфуд' },
  { value: 'bar',        label: 'Бар' },
];

export default function RegisterPage() {
  const [done, setDone] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: '' },
  });

  const nameValue = watch('name');
  const slugValue = watch('slug');

  useEffect(() => {
    if (!slugEdited && nameValue) {
      const generated = generateSlug(nameValue);
      if (generated.length >= 2) {
        setValue('slug', generated, { shouldValidate: false });
      }
    }
  }, [nameValue, slugEdited, setValue]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await registerRestaurant({
        email: data.email,
        password: data.password,
        name: data.name,
        slug: data.slug,
        phone: data.phone || undefined,
        city: data.city || undefined,
        type: data.type || undefined,
      });
      setSubmittedName(data.name);
      setDone(true);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        showToast('Email или адрес меню уже заняты', 'error');
      } else {
        showToast('Ошибка при регистрации', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.successIcon}>✅</div>
          <div className={styles.successTitle}>Заявка отправлена!</div>
          <p className={styles.successText}>
            Мы рассмотрим заявку для «{submittedName}» в течение 24 часов.
            <br />
            После одобрения вы получите доступ к панели управления.
          </p>
          <Link to="/login" className={styles.backBtn}>
            Вернуться к входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoSection}>
          <div className={styles.logoText}>qrmenu.kz</div>
          <div className={styles.logoSubtitle}>Регистрация заведения</div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <FormField label="Название заведения" error={errors.name?.message} required>
            <input
              {...register('name')}
              placeholder="Кафе «Аромат»"
              style={INPUT_STYLE}
            />
          </FormField>

          <FormField label="Адрес меню" error={errors.slug?.message} required>
            <input
              {...register('slug', { onChange: () => setSlugEdited(true) })}
              placeholder="cafe-aromat"
              style={INPUT_STYLE}
            />
            {slugValue && (
              <div className={styles.slugPreview}>
                qrmenu.kz/menu/<strong>{slugValue}</strong>
              </div>
            )}
          </FormField>

          <FormField label="Email" error={errors.email?.message} required>
            <input
              {...register('email')}
              type="email"
              placeholder="cafe@example.com"
              style={INPUT_STYLE}
            />
          </FormField>

          <div className={styles.row}>
            <FormField label="Пароль" error={errors.password?.message} required>
              <input
                {...register('password')}
                type="password"
                placeholder="Минимум 8 символов"
                style={INPUT_STYLE}
              />
            </FormField>
            <FormField label="Подтверждение" error={errors.confirmPassword?.message} required>
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="Повторите пароль"
                style={INPUT_STYLE}
              />
            </FormField>
          </div>

          <div className={styles.divider}>Дополнительно (необязательно)</div>

          <div className={styles.row}>
            <FormField label="Телефон" error={errors.phone?.message}>
              <input
                {...register('phone')}
                placeholder="+7 701 123 4567"
                style={INPUT_STYLE}
              />
            </FormField>
            <FormField label="Город" error={errors.city?.message}>
              <input
                {...register('city')}
                placeholder="Алматы"
                style={INPUT_STYLE}
              />
            </FormField>
          </div>

          <FormField label="Тип заведения" error={errors.type?.message}>
            <select {...register('type')} style={INPUT_STYLE} className={styles.select}>
              <option value="">Выберите тип</option>
              {VENUE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </FormField>

          <button
            type="submit"
            disabled={loading}
            className={`${styles.btnSubmit} ${loading ? styles.btnSubmitLoading : ''}`}
          >
            {loading ? 'Отправка...' : 'Отправить заявку'}
          </button>
        </form>

        <div className={styles.footer}>
          Уже есть аккаунт?{' '}
          <Link to="/login" className={styles.loginLink}>
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
}
