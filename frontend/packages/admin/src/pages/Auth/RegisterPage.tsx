import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast, FormField, Icon, PhoneInput, validatePhone } from '@qrmenu/ui';
import { registerRequest, registerVerify } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import styles from './RegisterPage.module.css';

const INPUT_CLASS = styles.inputField;

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
    phone: z
      .string()
      .optional()
      .refine(
        (v) => !v || validatePhone(v),
        'Введите корректный номер в формате +7 (XXX) XXX-XX-XX',
      ),
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

const CODE_LEN = 6;
const TIMER_KEY = (email: string) => `ev_expires_${email}`;

function getStoredExpiry(email: string): number {
  try {
    const raw = localStorage.getItem(TIMER_KEY(email));
    if (!raw) return 0;
    return Math.max(0, Math.floor((new Date(raw).getTime() - Date.now()) / 1000));
  } catch {
    return 0;
  }
}

function setStoredExpiry(email: string, seconds: number) {
  try {
    const exp = new Date(Date.now() + seconds * 1000);
    localStorage.setItem(TIMER_KEY(email), exp.toISOString());
  } catch { /* ignore */ }
}

function clearStoredExpiry(email: string) {
  try { localStorage.removeItem(TIMER_KEY(email)); } catch { /* ignore */ }
}

// ── Code input ──────────────────────────────────────────────────────────────

function CodeInput({
  onComplete,
  loading,
}: {
  onComplete: (code: string) => void;
  loading: boolean;
}) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LEN).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const focus = (i: number) => refs.current[i]?.focus();

  const handleChange = (i: number, val: string) => {
    const ch = val.replace(/\D/g, '').slice(-1);
    const next = digits.map((d, idx) => (idx === i ? ch : d));
    setDigits(next);
    if (ch && i < CODE_LEN - 1) focus(i + 1);
    if (next.every(Boolean)) onComplete(next.join(''));
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      focus(i - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LEN);
    if (!text) return;
    e.preventDefault();
    const next = Array(CODE_LEN).fill('').map((_, i) => text[i] ?? '');
    setDigits(next);
    const filled = text.length;
    focus(Math.min(filled, CODE_LEN - 1));
    if (filled === CODE_LEN) onComplete(text);
  };

  return (
    <div className={styles.codeInputRow}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className={styles.codeDigit}
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={d}
          disabled={loading}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          autoComplete="off"
        />
      ))}
    </div>
  );
}

// ── Timer ───────────────────────────────────────────────────────────────────

function CountdownTimer({
  initialSeconds,
  onExpire,
}: {
  initialSeconds: number;
  onExpire: () => void;
}) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (seconds <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
      return;
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds, onExpire]);

  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return <span className={styles.timerValue}>{m}:{s}</span>;
}

// ── Main page ───────────────────────────────────────────────────────────────

type Step = 'form' | 'verify' | 'success';

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('form');
  const [pendingEmail, setPendingEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [slugEdited, setSlugEdited] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerExpired, setTimerExpired] = useState(false);
  const [resending, setResending] = useState(false);
  const lastFormData = useRef<FormData | null>(null);
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: '', phone: '' },
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

  // Restore timer from localStorage when re-mounting verify step
  useEffect(() => {
    if (step === 'verify' && pendingEmail) {
      const remaining = getStoredExpiry(pendingEmail);
      setTimerSeconds(remaining);
      setTimerExpired(remaining <= 0);
    }
  }, [step, pendingEmail]);

  const handleExpire = useCallback(() => setTimerExpired(true), []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await registerRequest({
        email: data.email,
        password: data.password,
        name: data.name,
        slug: data.slug,
        phone: data.phone || undefined,
        city: data.city || undefined,
        type: data.type || undefined,
      });
      lastFormData.current = data;
      setPendingEmail(data.email);
      setStoredExpiry(data.email, 600); // 10 min
      setTimerSeconds(600);
      setTimerExpired(false);
      setStep('verify');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        showToast('Email или адрес меню уже заняты', 'error');
      } else if (status === 429) {
        showToast('Слишком много попыток. Подождите 5 минут.', 'error');
      } else if (status === 503) {
        showToast('Не удалось отправить код. Попробуйте позже.', 'error');
      } else {
        showToast('Ошибка при регистрации', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (code: string) => {
    setLoading(true);
    try {
      const result = await registerVerify(pendingEmail, code);
      clearStoredExpiry(pendingEmail);
      setAuth(result.access_token, {
        id: result.id,
        email: result.email,
        name: result.name,
        slug: result.slug,
        plan: result.plan as 'starter' | 'business' | 'pro',
        is_active: result.is_active,
      });
      setStep('success');
      setTimeout(() => navigate('/dashboard', { replace: true }), 1800);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast(detail ?? 'Неверный код', 'error');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!lastFormData.current) return;
    setResending(true);
    try {
      await registerRequest({
        email: lastFormData.current.email,
        password: lastFormData.current.password,
        name: lastFormData.current.name,
        slug: lastFormData.current.slug,
        phone: lastFormData.current.phone || undefined,
        city: lastFormData.current.city || undefined,
        type: lastFormData.current.type || undefined,
      });
      setStoredExpiry(pendingEmail, 600);
      setTimerSeconds(600);
      setTimerExpired(false);
      showToast('Новый код отправлен', 'success');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 429) {
        showToast('Слишком много попыток. Подождите 5 минут.', 'error');
      } else {
        showToast('Не удалось отправить код. Попробуйте позже.', 'error');
      }
    } finally {
      setResending(false);
    }
  };

  // ── Success screen ───────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <div className={styles.page}>
        <div className={`${styles.card} ${styles.successCard}`}>
          <div className={styles.successIconWrap}>
            <Icon name="circle-check" size={56} />
          </div>
          <div className={styles.successTitle}>Проверка прошла успешно</div>
          <p className={styles.successText}>Входим в панель управления...</p>
        </div>
      </div>
    );
  }

  // ── Verify screen ────────────────────────────────────────────────────────

  if (step === 'verify') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logoSection}>
            <div className={styles.logoText}>qrmenus.kz</div>
            <div className={styles.logoSubtitle}>Подтверждение email</div>
          </div>

          <div className={styles.verifyDesc}>
            Мы отправили 6-значный код на{' '}
            <strong className={styles.verifyEmail}>{pendingEmail}</strong>
          </div>

          <CodeInput onComplete={handleVerify} loading={loading} />

          {loading && (
            <div className={styles.verifyLoading}>Проверяем код...</div>
          )}

          <div className={styles.timerRow}>
            {!timerExpired ? (
              <>
                <Icon name="clock" size={14} />
                <span className={styles.timerLabel}>Код истечёт через</span>
                <CountdownTimer
                  key={timerSeconds}
                  initialSeconds={timerSeconds}
                  onExpire={handleExpire}
                />
              </>
            ) : (
              <button
                className={styles.btnResend}
                onClick={handleResend}
                disabled={resending}
              >
                <Icon name="refresh" size={14} />
                {resending ? 'Отправка...' : 'Отправить новый код'}
              </button>
            )}
          </div>

          <button
            className={styles.btnChangeEmail}
            onClick={() => setStep('form')}
          >
            <Icon name="arrow-left" size={14} />
            Изменить email
          </button>
        </div>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoSection}>
          <div className={styles.logoText}>qrmenus.kz</div>
          <div className={styles.logoSubtitle}>Регистрация заведения</div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <FormField label="Название заведения" error={errors.name?.message} required>
            <input
              {...register('name')}
              placeholder="Кафе «Аромат»"
              className={INPUT_CLASS}
            />
          </FormField>

          <FormField label="Адрес меню" error={errors.slug?.message} required>
            <input
              {...register('slug', { onChange: () => setSlugEdited(true) })}
              placeholder="cafe-aromat"
              className={INPUT_CLASS}
            />
            {slugValue && (
              <div className={styles.slugPreview}>
                {(import.meta.env.VITE_APP_URL ?? 'https://qrmenus.kz')}/menu/<strong>{slugValue}</strong>
              </div>
            )}
          </FormField>

          <FormField label="Email" error={errors.email?.message} required>
            <input
              {...register('email')}
              type="email"
              placeholder="cafe@example.com"
              className={INPUT_CLASS}
            />
          </FormField>

          <div className={styles.row}>
            <FormField label="Пароль" error={errors.password?.message} required>
              <input
                {...register('password')}
                type="password"
                placeholder="Минимум 8 символов"
                className={INPUT_CLASS}
              />
            </FormField>
            <FormField label="Подтверждение" error={errors.confirmPassword?.message} required>
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="Повторите пароль"
                className={INPUT_CLASS}
              />
            </FormField>
          </div>

          <div className={styles.divider}>Дополнительно (необязательно)</div>

          <div className={styles.row}>
            <FormField label="Телефон" error={errors.phone?.message}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormField>
            <FormField label="Город" error={errors.city?.message}>
              <input
                {...register('city')}
                placeholder="Алматы"
                className={INPUT_CLASS}
              />
            </FormField>
          </div>

          <FormField label="Тип заведения" error={errors.type?.message}>
            <select {...register('type')} className={`${INPUT_CLASS} ${styles.select}`}>
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
