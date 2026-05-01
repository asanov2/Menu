// === FILE: frontend/packages/admin/src/api/auth.ts ===
import { adminApi } from '@qrmenu/ui';
import type { RestaurantAuth } from '@qrmenu/ui';

export async function login(email: string, password: string): Promise<{ access_token: string; restaurant: RestaurantAuth }> {
  const { data } = await adminApi.post('/api/v1/auth/login', { email, password });
  return data;
}

export async function getMe(): Promise<RestaurantAuth> {
  const { data } = await adminApi.get('/api/v1/auth/me');
  return data;
}

export async function updateProfile(payload: { name?: string; email?: string }): Promise<RestaurantAuth> {
  const { data } = await adminApi.patch('/api/v1/auth/me', payload);
  return data;
}

export async function changePassword(payload: { old_password: string; new_password: string }): Promise<void> {
  await adminApi.post('/api/v1/auth/change-password', payload);
}
