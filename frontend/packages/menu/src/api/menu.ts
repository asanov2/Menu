import { menuApi } from '@qrmenu/ui';
import type { MenuPageResponse } from '@qrmenu/ui';

export const getMenu = async (
  slug: string,
  lang = 'ru',
  menuId?: string,
): Promise<MenuPageResponse> => {
  const params: Record<string, string> = { lang };
  if (menuId) params.menu_id = menuId;
  const { data } = await menuApi.get<MenuPageResponse>(`/api/v1/menu/${slug}`, { params });
  return data;
};

export const callWaiter = async (slug: string, table: number): Promise<void> => {
  await menuApi.post(`/api/v1/menu/${slug}/call-waiter`, { table });
};

export const trackItemView = (slug: string, itemId: string): void => {
  menuApi.post(`/api/v1/menu/${slug}/items/${itemId}/view`).catch(() => {});
};
