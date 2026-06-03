import { adminApi } from '@qrmenu/ui';
import type { WebPushSubscription } from '@qrmenu/ui';

export async function getVapidPublicKey(): Promise<string> {
  const { data } = await adminApi.get<{ public_key: string }>('/api/v1/push/vapid-public-key');
  return data.public_key;
}

export async function subscribePush(sub: WebPushSubscription, deviceLabel: string): Promise<void> {
  await adminApi.post('/api/v1/push/subscribe', {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    device_label: deviceLabel,
  });
}

export async function unsubscribePush(endpoint: string): Promise<void> {
  await adminApi.delete('/api/v1/push/unsubscribe', { data: { endpoint } });
}

export async function checkPushSubscription(endpoint: string): Promise<boolean> {
  const { data } = await adminApi.get<{ subscribed: boolean }>('/api/v1/push/status', {
    params: { endpoint },
  });
  return data.subscribed;
}
