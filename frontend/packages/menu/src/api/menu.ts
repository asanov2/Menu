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

export interface OrderConfig {
  orders_enabled: boolean;
  preorders_enabled: boolean;
  tables_count: number;
  telegram_connected: boolean;
}

export interface OrderItemPayload {
  item_id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderPayload {
  order_type: 'table' | 'preorder';
  table_number?: number;
  customer_name?: string;
  customer_phone?: string;
  items: OrderItemPayload[];
  total_price: number;
  comment?: string;
}

export interface OrderResult {
  order_id: string;
  message: string;
}

export const getOrderConfig = async (slug: string): Promise<OrderConfig> => {
  const { data } = await menuApi.get<OrderConfig>(`/api/v1/menu/${slug}/order-config`);
  return data;
};

export const submitOrder = async (slug: string, payload: OrderPayload): Promise<OrderResult> => {
  const { data } = await menuApi.post<OrderResult>(`/api/v1/menu/${slug}/order`, payload);
  return data;
};
