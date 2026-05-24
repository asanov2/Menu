import { adminApi } from '@qrmenu/ui';
import type { MenuItem } from '@qrmenu/ui';

export async function getItems(categoryId: string): Promise<MenuItem[]> {
  const { data } = await adminApi.get(`/api/v1/admin/items?category_id=${categoryId}`);
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
  await adminApi.put('/api/v1/admin/items/reorder', items);
}

export interface NutritionSuggestion {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export async function suggestNutrition(
  name: string,
  description?: string | null,
): Promise<NutritionSuggestion> {
  const { data } = await adminApi.post('/api/v1/admin/items/suggest-nutrition', {
    name,
    description: description ?? null,
  });
  return data;
}

export interface GenerateDescriptionParams {
  name: string;
  category_name?: string | null;
  length: 'short' | 'medium' | 'long';
  style: 'classic' | 'appetizing' | 'premium';
  language: 'ru' | 'kz' | 'en';
}

export async function generateDescription(params: GenerateDescriptionParams): Promise<string> {
  const { data } = await adminApi.post('/api/v1/admin/items/generate-description', params);
  return data.description;
}
