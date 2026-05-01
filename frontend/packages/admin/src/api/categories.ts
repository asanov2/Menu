// === FILE: frontend/packages/admin/src/api/categories.ts ===
import { adminApi } from '@qrmenu/ui';
import type { Category } from '@qrmenu/ui';

export async function getCategories(menuId: string): Promise<Category[]> {
  const { data } = await adminApi.get('/api/v1/admin/categories', { params: { menu_id: menuId } });
  return data;
}

export async function createCategory(payload: { name: string; menu_id: string }): Promise<Category> {
  const { data } = await adminApi.post('/api/v1/admin/categories', payload);
  return data;
}

export async function updateCategory(id: string, payload: Partial<{ name: string; is_visible: boolean }>): Promise<Category> {
  const { data } = await adminApi.put(`/api/v1/admin/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await adminApi.delete(`/api/v1/admin/categories/${id}`);
}

export async function reorderCategories(items: { id: string; sort_order: number }[]): Promise<void> {
  await adminApi.put('/api/v1/admin/categories/reorder', { items });
}
