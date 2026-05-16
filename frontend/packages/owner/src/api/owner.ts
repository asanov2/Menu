// === FILE: frontend/packages/owner/src/api/owner.ts ===
import { ownerApi } from './ownerApi'

export interface OwnerRestaurant {
  id: string
  name: string
  slug: string
  email: string
  plan: string
  status: string
  registration_status: string
  is_active: boolean
  created_at: string
  trial_ends_at: string | null
}

export interface ApplicationItem {
  id: string
  name: string
  slug: string
  email: string
  phone: string | null
  city: string | null
  type: string | null
  created_at: string
}

export interface ApplicationsResponse {
  items: ApplicationItem[]
  total: number
  page: number
  pages: number
}

export interface RestaurantList {
  items: OwnerRestaurant[]
  total: number
  page: number
  pages: number
}

export interface RevenueMonth {
  month: string
  amount: number
  count: number
}

export interface PaymentRecord {
  id: string
  restaurant_name: string
  amount: number
  status: string
  provider: string
  created_at: string
}

export interface PaymentList {
  items: PaymentRecord[]
  total: number
  page: number
  pages: number
}

export interface ServiceHealth {
  name: string
  status: 'online' | 'offline'
  response_ms: number | null
  checked_at: string
}

export interface SystemHealth {
  services: ServiceHealth[]
  all_healthy: boolean
}

export interface PlatformStats {
  total_restaurants: number
  active_restaurants: number
  trial_count: number
  mrr: number
  starter_count: number
  business_count: number
  pro_count: number
}

export async function ownerLogin(
  email: string,
  password: string,
): Promise<{ access_token: string }> {
  const { data } = await ownerApi.post('/api/v1/owner/login', { email, password })
  return data
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const { data } = await ownerApi.get('/api/v1/owner/stats')
  return data
}

export async function getRestaurants(params: {
  search?: string
  plan?: string
  status?: string
  page?: number
  limit?: number
}): Promise<RestaurantList> {
  const { data } = await ownerApi.get('/api/v1/owner/restaurants', { params })
  return data
}

export async function updateRestaurant(
  id: string,
  patch: { is_active?: boolean; plan?: string },
): Promise<void> {
  await ownerApi.patch(`/api/v1/owner/restaurants/${id}`, patch)
}

export async function getRevenue(year: number): Promise<RevenueMonth[]> {
  const { data } = await ownerApi.get('/api/v1/owner/revenue', { params: { year } })
  return data
}

export async function getPayments(page = 1): Promise<PaymentList> {
  const { data } = await ownerApi.get('/api/v1/owner/payments', { params: { page } })
  return data
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const { data } = await ownerApi.get('/api/v1/owner/system/health')
  return data
}

export async function getApplications(page = 1, limit = 20): Promise<ApplicationsResponse> {
  const { data } = await ownerApi.get('/api/v1/owner/applications', { params: { page, limit } })
  return data
}

export async function approveApplication(id: string): Promise<void> {
  await ownerApi.post(`/api/v1/owner/applications/${id}/approve`)
}

export async function rejectApplication(id: string): Promise<void> {
  await ownerApi.post(`/api/v1/owner/applications/${id}/reject`)
}
