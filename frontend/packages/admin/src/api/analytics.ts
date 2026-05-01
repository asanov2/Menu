// === FILE: frontend/packages/admin/src/api/analytics.ts ===
import { adminApi } from '@qrmenu/ui';
import type { OverviewStats, TopItem } from '@qrmenu/ui';

export async function getOverview(days: number): Promise<OverviewStats> {
  const { data } = await adminApi.get('/api/v1/analytics/overview', { params: { days } });
  return data;
}

export async function getTopItems(days: number, limit: number): Promise<TopItem[]> {
  const { data } = await adminApi.get('/api/v1/analytics/items/top', { params: { days, limit } });
  return data;
}
