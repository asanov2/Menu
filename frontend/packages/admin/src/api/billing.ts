// === FILE: frontend/packages/admin/src/api/billing.ts ===
import { adminApi } from '@qrmenu/ui';
import type { Subscription } from '@qrmenu/ui';

interface Payment {
  id: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  provider: string;
  created_at: string;
}

interface BillingData {
  subscription: Subscription;
  payments: Payment[];
}

export async function getSubscription(): Promise<BillingData> {
  const { data } = await adminApi.get('/api/v1/billing/subscription');
  return data;
}

export async function upgradeSubscription(plan: string): Promise<{ payment_url: string; payment_id: string }> {
  const { data } = await adminApi.post('/api/v1/billing/subscription/upgrade', { plan });
  return data;
}

export async function cancelSubscription(): Promise<void> {
  await adminApi.post('/api/v1/billing/subscription/cancel');
}
