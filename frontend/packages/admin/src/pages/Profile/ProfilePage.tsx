// === FILE: frontend/packages/admin/src/pages/Profile/ProfilePage.tsx ===
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@qrmenu/ui';
import { useState } from 'react';
import { updateProfile, changePassword } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';

const profileSchema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  email: z.string().email('Некорректный email'),
});
type ProfileData = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  old_password: z.string().min(1, 'Обязательное поле'),
  new_password: z.string().min(8, 'Минимум 8 символов'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Пароли не совпадают',
  path: ['confirm_password'],
});
type PasswordData = z.infer<typeof passwordSchema>;

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--cream-surface)',
  border: '0.5px solid var(--cream-border)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 12px',
  fontSize: 13,
  fontFamily: 'var(--font-ui)',
  outline: 'none',
  boxSizing: 'border-box',
};

function cardStyle(): React.CSSProperties {
  return { background: 'var(--cream-bg)', border: '0.5px solid var(--cream-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 24 };
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function ProfilePage() {
  const { restaurant } = useAuth();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { showToast } = useToast();
  const [profileSaving, setProfileSaving] = useState(false);
  const [passSaving, setPassSaving] = useState(false);

  const { register: rp, handleSubmit: hsp, formState: { errors: ep } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: restaurant?.name ?? '', email: restaurant?.email ?? '' },
  });

  const { register: rpass, handleSubmit: hspass, reset: resetPass, formState: { errors: epass } } = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSaveProfile = async (data: ProfileData) => {
    setProfileSaving(true);
    try {
      const updated = await updateProfile(data);
      const token = localStorage.getItem('admin_token') ?? '';
      setAuth(token, updated);
      showToast('Сохранено ✓', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ошибка сервера';
      showToast(`Ошибка: ${msg}`, 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const onChangePassword = async (data: PasswordData) => {
    setPassSaving(true);
    try {
      await changePassword({ old_password: data.old_password, new_password: data.new_password });
      resetPass();
      showToast('Пароль изменён ✓', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ошибка сервера';
      showToast(`Ошибка: ${msg}`, 'error');
    } finally {
      setPassSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 540 }}>
      {/* Restaurant info */}
      <div style={cardStyle()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'var(--cream-surface)', fontFamily: 'var(--font-ui)', flexShrink: 0 }}>
            {restaurant ? initials(restaurant.name) : '?'}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink-primary)' }}>
              {restaurant?.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', marginTop: 2 }}>
              {restaurant?.email}
            </div>
          </div>
        </div>

        <form onSubmit={hsp(onSaveProfile)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label htmlFor="profile-name" style={{ fontSize: 11, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', display: 'block', marginBottom: 4 }}>Название ресторана</label>
            <input id="profile-name" {...rp('name')} style={{ ...inputStyle, borderColor: ep.name ? 'var(--error-text)' : 'var(--cream-border)' }} onFocus={(e) => { e.target.style.borderColor = 'var(--accent-gold)'; }} onBlur={(e) => { e.target.style.borderColor = ep.name ? 'var(--error-text)' : 'var(--cream-border)'; }} />
            {ep.name && <div style={{ fontSize: 11, color: 'var(--error-text)', marginTop: 3, fontFamily: 'var(--font-ui)' }}>{ep.name.message}</div>}
          </div>
          <div>
            <label htmlFor="profile-email" style={{ fontSize: 11, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', display: 'block', marginBottom: 4 }}>Email</label>
            <input id="profile-email" {...rp('email')} type="email" style={{ ...inputStyle, borderColor: ep.email ? 'var(--error-text)' : 'var(--cream-border)' }} onFocus={(e) => { e.target.style.borderColor = 'var(--accent-gold)'; }} onBlur={(e) => { e.target.style.borderColor = ep.email ? 'var(--error-text)' : 'var(--cream-border)'; }} />
            {ep.email && <div style={{ fontSize: 11, color: 'var(--error-text)', marginTop: 3, fontFamily: 'var(--font-ui)' }}>{ep.email.message}</div>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={profileSaving} style={{ padding: '9px 20px', background: 'var(--ink-primary)', color: 'var(--cream-bg)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 500, cursor: profileSaving ? 'not-allowed' : 'pointer', opacity: profileSaving ? 0.7 : 1 }}>
              {profileSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div style={cardStyle()}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink-primary)', marginBottom: 20 }}>Изменить пароль</div>
        <form onSubmit={hspass(onChangePassword)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { name: 'old_password' as const, label: 'Текущий пароль', id: 'pass-old', err: epass.old_password },
            { name: 'new_password' as const, label: 'Новый пароль', id: 'pass-new', err: epass.new_password },
            { name: 'confirm_password' as const, label: 'Подтвердите пароль', id: 'pass-confirm', err: epass.confirm_password },
          ].map(({ name, label, id, err }) => (
            <div key={name}>
              <label htmlFor={id} style={{ fontSize: 11, color: 'var(--ink-secondary)', fontFamily: 'var(--font-ui)', display: 'block', marginBottom: 4 }}>{label}</label>
              <input id={id} {...rpass(name)} type="password" style={{ ...inputStyle, borderColor: err ? 'var(--error-text)' : 'var(--cream-border)' }} onFocus={(e) => { e.target.style.borderColor = 'var(--accent-gold)'; }} onBlur={(e) => { e.target.style.borderColor = err ? 'var(--error-text)' : 'var(--cream-border)'; }} />
              {err && <div style={{ fontSize: 11, color: 'var(--error-text)', marginTop: 3, fontFamily: 'var(--font-ui)' }}>{err.message}</div>}
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={passSaving} style={{ padding: '9px 20px', background: 'var(--ink-primary)', color: 'var(--cream-bg)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 500, cursor: passSaving ? 'not-allowed' : 'pointer', opacity: passSaving ? 0.7 : 1 }}>
              {passSaving ? 'Изменение...' : 'Изменить пароль'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
