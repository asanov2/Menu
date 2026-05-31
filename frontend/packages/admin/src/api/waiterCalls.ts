import { adminApi } from '@qrmenu/ui';

export interface WaiterCall {
  id: string;
  table_number: number;
  menu_id: string;
  menu_name: string;
  status: 'new' | 'done';
  created_at: string;
}

export interface WaiterCallsResponse {
  calls: WaiterCall[];
  has_more: boolean;
}

export async function getWaiterCalls(params?: {
  before?: string;
  load_older?: boolean;
}): Promise<WaiterCallsResponse> {
  const { data } = await adminApi.get<WaiterCallsResponse>('/api/v1/admin/waiter-calls', {
    params,
  });
  return data;
}

export async function updateWaiterCallStatus(
  id: string,
  status: 'new' | 'done',
): Promise<WaiterCall> {
  const { data } = await adminApi.patch<WaiterCall>(
    `/api/v1/admin/waiter-calls/${id}/status`,
    { status },
  );
  return data;
}
