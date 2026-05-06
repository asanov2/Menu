// === FILE: frontend/packages/admin/src/api/billing.ts ===
import { adminApi } from '@qrmenu/ui';

interface Subscription {
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
}

interface Payment {
  id: string
  subscription_id: string
  restaurant_id: string
  amount: number
  currency: string
  status: 'pending' | 'success' | 'failed' | 'refunded'
  provider: string
  provider_transaction_id: string | null
  paid_at: string | null
  created_at: string
}

interface BillingData {
  subscription: Subscription
  payments: Payment[]
}

export async function getSubscription(): Promise<BillingData> {
  const { data } = await adminApi.get('/api/v1/billing/subscription')
  const { payments, ...subscription } = data
  return { subscription, payments: payments ?? [] }
}

export async function upgradeSubscription(plan: string): Promise<{ payment_url: string; payment_id: string }> {
  const { data } = await adminApi.post('/api/v1/billing/subscription/upgrade', { plan });
  return data;
}

export async function cancelSubscription(): Promise<void> {
  await adminApi.post('/api/v1/billing/subscription/cancel');
}
