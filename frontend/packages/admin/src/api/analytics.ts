// === FILE: frontend/packages/admin/src/api/analytics.ts ===
import { adminApi } from '@qrmenu/ui';
import type { OverviewStats, TopItem } from '@qrmenu/ui';

export async function getOverview(period_days: number): Promise<OverviewStats> {
  const { data } = await adminApi.get('/api/v1/analytics/overview', { params: { period_days } });
  return data;
}

export async function getTopItems(period_days: number, limit: number): Promise<TopItem[]> {
  const { data } = await adminApi.get('/api/v1/analytics/top-items', { params: { period_days, limit } });
  return data;
}
