import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { INPUT_STYLE, useInputFocus, FormField, Icon } from '@qrmenu/ui';
import { login, getMe } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import styles from './LoginPage.module.css';

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const emailFocus    = useInputFocus(!!errors.email);
  const passwordFocus = useInputFocus(!!errors.password);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError(null);
    try {
      const result = await login(data.email, data.password);
      const restaurant = await getMe(result.access_token);
      setAuth(result.access_token, restaurant);
      navigate('/dashboard');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        setServerError('Неверный email или пароль');
      } else {
        setServerError('Ошибка подключения. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoSection}>
          <div className={styles.logoText}>qrmenu.kz</div>
          <div className={styles.logoSubtitle}>Панель управления рестораном</div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <FormField label="Email" error={errors.email?.message} required>
            <input
              id="login-email"
              {...register('email', { onChange: () => setServerError(null) })}
              {...emailFocus}
              type="email"
              placeholder="Email"
              style={{ ...INPUT_STYLE, borderColor: errors.email ? 'var(--error-text)' : 'var(--cream-border)' }}
            />
          </FormField>

          <FormField label="Пароль" error={errors.password?.message} required>
            <div className={styles.passwordWrapper}>
              <input
                id="login-password"
                {...register('password', { onChange: () => setServerError(null) })}
                {...passwordFocus}
                type={showPass ? 'text' : 'password'}
                placeholder="Пароль"
                style={{ ...INPUT_STYLE, paddingRight: 40, borderColor: errors.password ? 'var(--error-text)' : 'var(--cream-border)' }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className={styles.showPassBtn}
              >
                {showPass ? <Icon name="eye-off" size={16} /> : <Icon name="eye" size={16} />}
              </button>
            </div>
          </FormField>

          {serverError && (
            <div className={styles.serverError}>
              <i className="ti ti-alert-circle" style={{ fontSize: 14 }} />
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`${styles.btnLogin} ${loading ? styles.btnLoginLoading : ''}`}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>

      <div className={styles.footer}>
        14 дней бесплатно —{' '}
        <Link to="/register" className={styles.registerLink}>
          Зарегистрироваться
        </Link>
      </div>
    </div>
  );
}
