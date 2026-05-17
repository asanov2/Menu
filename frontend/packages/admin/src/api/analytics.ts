import { adminApi } from '@qrmenu/ui';
import type { CategoryTopItems, OverviewStats, DailyStats, PeakHourData } from '@qrmenu/ui';

export async function getOverview(periodDays: number): Promise<OverviewStats> {
  const { data } = await adminApi.get('/api/v1/analytics/overview', { params: { days: periodDays } });
  return data;
}

export async function getDailyStats(startDate: string, endDate: string): Promise<DailyStats[]> {
  const { data } = await adminApi.get('/api/v1/analytics/daily', {
    params: { start: startDate, end: endDate },
  });
  return data;
}

export async function getPeakHours(periodDays: number): Promise<PeakHourData[]> {
  const { data } = await adminApi.get('/api/v1/analytics/peak-hours', {
    params: { days: periodDays },
  });
  return data;
}

export async function getTopByCategory(periodDays: number): Promise<CategoryTopItems[]> {
  const { data } = await adminApi.get('/api/v1/analytics/items/top-by-category', {
    params: { days: periodDays },
  });
  return data;
}
