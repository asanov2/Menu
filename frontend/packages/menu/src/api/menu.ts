import { menuApi } from '@qrmenu/ui/src/utils/axios';
import type { MenuPageResponse } from '@qrmenu/ui';

export const getMenu = async (
  slug: string,
  lang = 'ru'
): Promise<MenuPageResponse> => {
  const { data } = await menuApi.get<MenuPageResponse>(`/api/v1/menu/${slug}`, {
    params: { lang },
  });
  return data;
};

export const callWaiter = async (slug: string, table: number): Promise<void> => {
  await menuApi.post(`/api/v1/menu/${slug}/call-waiter`, { table });
};
