// === FILE: frontend/packages/admin/src/api/auth.ts ===
import { adminApi } from '@qrmenu/ui';
import type { RestaurantAuth } from '@qrmenu/ui';

export async function login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
  const { data } = await adminApi.post('/api/v1/auth/login', { email, password });
  return data;
}

export async function getMe(token?: string): Promise<RestaurantAuth> {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const { data } = await adminApi.get('/api/v1/auth/me', config);
  return data;
}

export async function updateProfile(payload: { name?: string; email?: string }): Promise<RestaurantAuth> {
  const { data } = await adminApi.put('/api/v1/auth/profile', payload);
  return data;
}

export async function changePassword(payload: { old_password: string; new_password: string }): Promise<void> {
  await adminApi.put('/api/v1/auth/change-password', payload);
}

export async function registerRequest(data: {
  email: string;
  password: string;
  name: string;
  slug: string;
  phone?: string;
  city?: string;
  type?: string;
}): Promise<void> {
  await adminApi.post('/api/v1/auth/register-request', data);
}

export interface RegisterVerifyResponse {
  access_token: string;
  token_type: string;
  id: string;
  email: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
}

export async function registerVerify(email: string, code: string): Promise<RegisterVerifyResponse> {
  const { data } = await adminApi.post('/api/v1/auth/register-verify', { email, code });
  return data;
}
