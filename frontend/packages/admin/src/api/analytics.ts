// === FILE: frontend/packages/admin/src/api/analytics.ts ===
import { adminApi } from '@qrmenu/ui';
import type { OverviewStats, TopItem } from '@qrmenu/ui';

export async function getOverview(periodDays: number): Promise<OverviewStats> {
  const { data } = await adminApi.get('/api/v1/analytics/overview', { params: { days: periodDays } });
  return data;
}

export async function getTopItems(periodDays: number, limit = 10): Promise<TopItem[]> {
  const { data } = await adminApi.get('/api/v1/analytics/items/top', { params: { days: periodDays, limit } });
  return data;
}
