import { adminApi } from '@qrmenu/ui';

export interface TranslateResult {
  translated_categories: number;
  translated_items: number;
}

export async function translateMenu(
  menuId: string,
  languages: string[],
): Promise<TranslateResult> {
  const { data } = await adminApi.post(`/api/v1/admin/menus/${menuId}/translate`, { languages });
  return data;
}

export async function translateItem(
  itemId: string,
  languages: string[],
): Promise<TranslateResult> {
  const { data } = await adminApi.post(`/api/v1/admin/items/${itemId}/translate`, { languages });
  return data;
}
