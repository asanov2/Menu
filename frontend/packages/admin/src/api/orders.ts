import { adminApi } from '@qrmenu/ui';

export interface OrderItem {
  item_id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  order_type: 'table' | 'preorder';
  table_number: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  items: OrderItem[];
  total_price: number;
  comment: string | null;
  menu_id: string;
  menu_name: string;
  status: 'new' | 'done';
  created_at: string; // ISO datetime
}

export interface OrdersResponse {
  orders: Order[];
  has_more: boolean;
}

export async function getOrders(params?: {
  before?: string;
  load_older?: boolean;
}): Promise<OrdersResponse> {
  const { data } = await adminApi.get('/api/v1/admin/orders', { params });
  return data;
}

export async function updateOrderStatus(
  orderId: string,
  status: 'new' | 'done',
): Promise<Order> {
  const { data } = await adminApi.patch(`/api/v1/admin/orders/${orderId}/status`, { status });
  return data;
}
