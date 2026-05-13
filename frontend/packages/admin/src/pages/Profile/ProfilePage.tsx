import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast, INPUT_STYLE, useInputFocus, getApiErrorMessage, FormField } from '@qrmenu/ui';
import { useState } from 'react';
import { updateProfile, changePassword } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import styles from './ProfilePage.module.css';
import common from '../../styles/common.module.css';

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

  const profileNameFocus     = useInputFocus(!!ep.name);
  const profileEmailFocus    = useInputFocus(!!ep.email);
  const oldPasswordFocus     = useInputFocus(!!epass.old_password);
  const newPasswordFocus     = useInputFocus(!!epass.new_password);
  const confirmPasswordFocus = useInputFocus(!!epass.confirm_password);

  const onSaveProfile = async (data: ProfileData) => {
    setProfileSaving(true);
    try {
      const updated = await updateProfile(data);
      const token = localStorage.getItem('admin_token') ?? '';
      setAuth(token, updated);
      showToast('Сохранено ✓', 'success');
    } catch (err: unknown) {
      showToast(`Ошибка: ${getApiErrorMessage(err, 'Ошибка сервера')}`, 'error');
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
      showToast(`Ошибка: ${getApiErrorMessage(err, 'Ошибка сервера')}`, 'error');
    } finally {
      setPassSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Restaurant info */}
      <div className={common.card}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            {restaurant ? initials(restaurant.name) : '?'}
          </div>
          <div>
            <div className={styles.restaurantName}>{restaurant?.name}</div>
            <div className={styles.restaurantEmail}>{restaurant?.email}</div>
          </div>
        </div>

        <form onSubmit={hsp(onSaveProfile)} className={styles.form}>
          <FormField label="Название ресторана" error={ep.name?.message} required>
            <input
              id="profile-name"
              {...rp('name')}
              {...profileNameFocus}
              style={{ ...INPUT_STYLE, borderColor: ep.name ? 'var(--error-text)' : 'var(--cream-border)' }}
            />
          </FormField>

          <FormField label="Email" error={ep.email?.message} required>
            <input
              id="profile-email"
              {...rp('email')}
              {...profileEmailFocus}
              type="email"
              style={{ ...INPUT_STYLE, borderColor: ep.email ? 'var(--error-text)' : 'var(--cream-border)' }}
            />
          </FormField>

          <div className={styles.formFooter}>
            <button
              type="submit"
              disabled={profileSaving}
              className={`${styles.btnSave} ${profileSaving ? styles.btnSaveLoading : ''}`}
            >
              {profileSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className={common.card}>
        <div className={styles.sectionTitle}>Изменить пароль</div>
        <form onSubmit={hspass(onChangePassword)} className={styles.form}>
          <FormField label="Текущий пароль" error={epass.old_password?.message} required>
            <input
              id="pass-old"
              {...rpass('old_password')}
              {...oldPasswordFocus}
              type="password"
              style={{ ...INPUT_STYLE, borderColor: epass.old_password ? 'var(--error-text)' : 'var(--cream-border)' }}
            />
          </FormField>

          <FormField label="Новый пароль" error={epass.new_password?.message} required>
            <input
              id="pass-new"
              {...rpass('new_password')}
              {...newPasswordFocus}
              type="password"
              style={{ ...INPUT_STYLE, borderColor: epass.new_password ? 'var(--error-text)' : 'var(--cream-border)' }}
            />
          </FormField>

          <FormField label="Подтвердите пароль" error={epass.confirm_password?.message} required>
            <input
              id="pass-confirm"
              {...rpass('confirm_password')}
              {...confirmPasswordFocus}
              type="password"
              style={{ ...INPUT_STYLE, borderColor: epass.confirm_password ? 'var(--error-text)' : 'var(--cream-border)' }}
            />
          </FormField>

          <div className={styles.formFooter}>
            <button
              type="submit"
              disabled={passSaving}
              className={`${styles.btnSave} ${passSaving ? styles.btnSaveLoading : ''}`}
            >
              {passSaving ? 'Изменение...' : 'Изменить пароль'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
