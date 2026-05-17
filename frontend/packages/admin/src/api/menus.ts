// === FILE: frontend/packages/admin/src/api/menus.ts ===
import { adminApi } from '@qrmenu/ui';
import type { Menu } from '@qrmenu/ui';

export interface MenuUsage {
  menus_used: number
  menus_limit: number | null
  items_used: number
  items_limit: number | null
}

export interface MenusResponse {
  menus: Menu[]
  usage: MenuUsage
}

export async function getMenus(): Promise<MenusResponse> {
  const { data } = await adminApi.get('/api/v1/admin/menus');
  return data;
}

export async function getMenu(id: string): Promise<Menu> {
  const { data } = await adminApi.get(`/api/v1/admin/menus/${id}`);
  return data;
}

export async function createMenu(payload: { name: string; language: string }): Promise<Menu> {
  const { data } = await adminApi.post('/api/v1/admin/menus', payload);
  return data;
}

export async function updateMenu(id: string, payload: Partial<{ name: string; language: string; is_default: boolean }>): Promise<Menu> {
  const { data } = await adminApi.put(`/api/v1/admin/menus/${id}`, payload);
  return data;
}

export async function deleteMenu(id: string): Promise<void> {
  await adminApi.delete(`/api/v1/admin/menus/${id}`);
}

export function getMenuUrl(slug: string): string {
  return `${import.meta.env.VITE_APP_URL ?? ''}/m/${slug}`;
}

export function generateQR(menuId: string): string {
  return `${import.meta.env.VITE_APP_URL ?? ''}/m/${menuId}`;
}
