// === FILE: frontend/packages/admin/src/api/items.ts ===
import { adminApi } from '@qrmenu/ui';
import type { MenuItem } from '@qrmenu/ui';

export async function getItems(categoryId: string): Promise<MenuItem[]> {
  const { data } = await adminApi.get(`/api/v1/admin/categories/${categoryId}/items`);
  return data;
}

export async function createItem(payload: Partial<MenuItem> & { category_id: string; name: string; price: number }): Promise<MenuItem> {
  const { data } = await adminApi.post('/api/v1/admin/items', payload);
  return data;
}

export async function updateItem(id: string, payload: Partial<MenuItem>): Promise<MenuItem> {
  const { data } = await adminApi.put(`/api/v1/admin/items/${id}`, payload);
  return data;
}

export async function deleteItem(id: string): Promise<void> {
  await adminApi.delete(`/api/v1/admin/items/${id}`);
}

export async function toggleAvailable(id: string): Promise<MenuItem> {
  const { data } = await adminApi.patch(`/api/v1/admin/items/${id}/toggle-available`);
  return data;
}

export async function reorderItems(items: { id: string; sort_order: number }[]): Promise<void> {
  await adminApi.put('/api/v1/admin/items/reorder', { items });
}
