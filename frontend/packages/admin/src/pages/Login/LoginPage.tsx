// === FILE: frontend/packages/admin/src/pages/Login/LoginPage.tsx ===
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@qrmenu/ui';
import { login } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});
type FormData = z.infer<typeof schema>;

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

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { showToast } = useToast();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const result = await login(data.email, data.password);
      setAuth(result.access_token, result.restaurant);
      navigate('/dashboard');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        showToast('Неверный email или пароль', 'error');
      } else {
        showToast('Ошибка подключения', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--cream-warm)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: '#FDFAF5',
          border: '0.5px solid var(--cream-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-card)',
          padding: '36px 32px 32px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink-primary)', marginBottom: 6 }}>
            qrmenu.kz
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)' }}>
            Панель управления рестораном
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <input
              {...register('email')}
              type="email"
              placeholder="Email"
              style={{ ...inputStyle, borderColor: errors.email ? 'var(--error-text)' : 'var(--cream-border)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent-gold)'; }}
              onBlur={(e) => { e.target.style.borderColor = errors.email ? 'var(--error-text)' : 'var(--cream-border)'; }}
            />
            {errors.email && <div style={{ fontSize: 11, color: 'var(--error-text)', marginTop: 4, fontFamily: 'var(--font-ui)' }}>{errors.email.message}</div>}
          </div>

          <div>
            <div style={{ position: 'relative' }}>
              <input
                {...register('password')}
                type={showPass ? 'text' : 'password'}
                placeholder="Пароль"
                style={{ ...inputStyle, paddingRight: 40, borderColor: errors.password ? 'var(--error-text)' : 'var(--cream-border)' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent-gold)'; }}
                onBlur={(e) => { e.target.style.borderColor = errors.password ? 'var(--error-text)' : 'var(--cream-border)'; }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--ink-tertiary)', padding: 2 }}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password && <div style={{ fontSize: 11, color: 'var(--error-text)', marginTop: 4, fontFamily: 'var(--font-ui)' }}>{errors.password.message}</div>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px 16px',
              background: loading ? 'var(--ink-secondary)' : 'var(--ink-primary)',
              color: 'var(--cream-bg)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-ui)',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: 20, fontSize: 13, fontFamily: 'var(--font-ui)', color: 'var(--ink-secondary)' }}>
        14 дней бесплатно —{' '}
        <span style={{ color: 'var(--ink-primary)', textDecoration: 'underline', cursor: 'pointer' }}>
          Зарегистрироваться
        </span>
      </div>
    </div>
  );
}
