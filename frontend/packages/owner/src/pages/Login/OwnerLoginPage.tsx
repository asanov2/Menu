import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useOwnerStore } from '../../store/ownerStore'
import { ownerLogin } from '../../api/owner'
import { INPUT_STYLE, useInputFocus, getApiErrorMessage, FormField } from '@qrmenu/ui'
import styles from './OwnerLoginPage.module.css'

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
})
type FormData = z.infer<typeof schema>

export default function OwnerLoginPage() {
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setToken = useOwnerStore(s => s.setToken)
  const token = useOwnerStore(s => s.token)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const emailFocus    = useInputFocus(!!errors.email)
  const passwordFocus = useInputFocus(!!errors.password)

  if (token) return <Navigate to="/dashboard" replace />

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setServerError('')
    try {
      const res = await ownerLogin(data.email, data.password)
      setToken(res.access_token)
      navigate('/dashboard')
    } catch (e: unknown) {
      setServerError(getApiErrorMessage(e, 'Неверные данные для входа'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoSection}>
          <div className={styles.logoText}>qrmenus.kz</div>
          <div className={styles.logoSubtitle}>Панель владельца</div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <FormField label="Email" error={errors.email?.message} required>
            <input
              {...register('email')}
              {...emailFocus}
              type="email"
              placeholder="owner@qrmenus.kz"
              style={{ ...INPUT_STYLE, borderColor: errors.email ? 'var(--error-text)' : 'var(--cream-border)' }}
            />
          </FormField>

          <FormField label="Пароль" error={errors.password?.message} required>
            <input
              {...register('password')}
              {...passwordFocus}
              type="password"
              placeholder="••••••••"
              style={{ ...INPUT_STYLE, borderColor: errors.password ? 'var(--error-text)' : 'var(--cream-border)' }}
            />
          </FormField>

          {serverError && (
            <div className={styles.serverError}>{serverError}</div>
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
    </div>
  )
}
