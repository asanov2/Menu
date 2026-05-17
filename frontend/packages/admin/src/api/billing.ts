import { adminApi } from '@qrmenu/ui';

export interface PlanInfo {
  id: 'starter' | 'business' | 'pro'
  name: string
  price: number
  features: string[]
  features_soon?: string[]
  isPopular?: boolean
}

export const PLANS: PlanInfo[] = [
  {
    id: 'starter',
    name: 'Старт',
    price: 3900,
    features: [
      '1 меню, до 50 блюд',
      'QR-код для ресторана',
      'Только русский язык',
      'Пометки на блюдах (хит, веган, острое)',
      'Базовая аналитика — 7 дней',
    ],
    features_soon: ['Кнопка «Позвать официанта»'],
  },
  {
    id: 'business',
    name: 'Бизнес',
    price: 7900,
    isPopular: true,
    features: [
      'До 200 блюд',
      '3 языка меню (RU / KZ / EN)',
      'До 5 меню (основное, бар, банкет)',
      'Аналитика — 30 дней',
      'Стоп-лист блюд',
      'Поиск по меню',
    ],
    features_soon: ['Telegram-уведомления'],
  },
  {
    id: 'pro',
    name: 'Про',
    price: 14900,
    features: [
      'Неограниченно блюд и меню',
      'Аналитика — 90 дней',
      'Приоритетная поддержка',
    ],
    features_soon: ['AI генерация описаний', 'Предзаказ со стола', 'Аллергены'],
  },
]

export interface Subscription {
  id: string
  restaurant_id: string
  plan: 'starter' | 'business' | 'pro'
  status: 'active' | 'trial' | 'expired' | 'cancelled'
  current_period_start: string
  current_period_end: string
  trial_ends_at: string | null
  auto_renew: boolean
  created_at: string
  updated_at: string
  trial_remaining_days: number | null
  warning_banner: boolean
  warning_message: string | null
}

export interface Payment {
  id: string
  subscription_id: string
  restaurant_id: string
  amount: number
  currency: string
  status: 'pending' | 'success' | 'failed' | 'refunded'
  provider: string
  target_plan: 'starter' | 'business' | 'pro' | null
  provider_transaction_id: string | null
  paid_at: string | null
  created_at: string
}

export interface UpgradeResult {
  payment_url: string
  payment_id: string
  amount: number
  plan: string
}

export interface MenuUsage {
  menus_used: number
  menus_limit: number | null
  items_used: number
  items_limit: number | null
}

export async function getSubscription(): Promise<{ subscription: Subscription; payments: Payment[] }> {
  const { data } = await adminApi.get('/api/v1/billing/subscription')
  const { payments, ...subscription } = data
  return { subscription, payments: payments ?? [] }
}

export async function getMenuUsage(): Promise<MenuUsage> {
  const { data } = await adminApi.get('/api/v1/admin/menus')
  return data.usage as MenuUsage
}

export async function upgradePlan(plan: string): Promise<UpgradeResult> {
  const { data } = await adminApi.post('/api/v1/billing/subscription/upgrade', { plan })
  return data
}

export async function completeMockPayment(): Promise<{ message: string; plan: string; status: string }> {
  const { data } = await adminApi.post('/api/v1/billing/subscription/mock-complete')
  return data
}

export async function cancelSubscription(): Promise<void> {
  await adminApi.post('/api/v1/billing/subscription/cancel')
}
