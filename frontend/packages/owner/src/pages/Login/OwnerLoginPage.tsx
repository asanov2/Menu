import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useOwnerStore } from '../../store/ownerStore'
import { ownerLogin } from '../../api/owner'
import { INPUT_STYLE, useInputFocus, getApiErrorMessage, FormField } from '@qrmenu/ui'

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

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const emailFocus    = useInputFocus(!!errors.email)
  const passwordFocus = useInputFocus(!!errors.password)

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
    <div style={{ minHeight: '100vh', background: 'var(--cream-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'var(--cream-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-modal)', padding: '40px 36px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--ink-primary)', letterSpacing: '-0.02em' }}>
            qrmenu.kz
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--ink-secondary)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Панель владельца
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Email" error={errors.email?.message} required>
            <input
              {...register('email')}
              {...emailFocus}
              type="email"
              placeholder="owner@qrmenu.kz"
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
            <div style={{ padding: '10px 12px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--error-text)' }}>
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '11px', background: loading ? 'var(--cream-muted)' : 'var(--ink-primary)', color: loading ? 'var(--ink-secondary)' : 'var(--cream-surface)', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s', marginTop: 4 }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
