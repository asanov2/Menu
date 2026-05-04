// === FILE: frontend/packages/owner/src/api/owner.ts ===
import { ownerApi } from '../store/ownerStore'

export interface OwnerRestaurant {
  id: string
  name: string
  slug: string
  email: string
  plan: 'starter' | 'business' | 'pro'
  status: 'active' | 'trial' | 'expired'
  is_active: boolean
  created_at: string
  trial_ends_at: string | null
  subscription_end: string | null
}

export interface RevenueMonth {
  month: string
  total_kzt: number
  restaurant_count: number
}

export interface PaymentRecord {
  id: string
  restaurant_name: string
  plan: string
  amount: number
  status: string
  provider: string
  paid_at: string
}

export interface ServiceHealth {
  name: string
  status: 'online' | 'offline'
  response_ms: number | null
  last_checked: string
}

export interface PlatformStats {
  total_restaurants: number
  active_restaurants: number
  trial_restaurants: number
  expired_restaurants: number
  mrr_kzt: number
  new_this_month: number
  churn_this_month: number
  conversion_rate: number
}

export async function ownerLogin(
  email: string,
  password: string,
): Promise<{ access_token: string }> {
  const { data } = await ownerApi.post('/owner/login', { email, password })
  return data
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const { data } = await ownerApi.get('/owner/stats')
  return data
}

export async function getRestaurants(params: {
  search?: string
  plan?: string
  status?: string
  page?: number
  limit?: number
}): Promise<{ items: OwnerRestaurant[]; total: number; pages: number }> {
  const { data } = await ownerApi.get('/owner/restaurants', { params })
  return data
}

export async function updateRestaurant(
  id: string,
  patch: { is_active?: boolean; plan?: string },
): Promise<void> {
  await ownerApi.patch(`/owner/restaurants/${id}`, patch)
}

export async function getRevenue(months = 6): Promise<RevenueMonth[]> {
  const { data } = await ownerApi.get('/owner/revenue', { params: { months } })
  return data
}

export async function getPayments(
  page = 1,
): Promise<{ items: PaymentRecord[]; total: number }> {
  const { data } = await ownerApi.get('/owner/payments', { params: { page } })
  return data
}

export async function getSystemHealth(): Promise<ServiceHealth[]> {
  const { data } = await ownerApi.get('/owner/health')
  return data
}
