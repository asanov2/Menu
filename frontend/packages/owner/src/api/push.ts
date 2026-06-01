import { ownerApi } from './ownerApi';
import type { WebPushSubscription } from '@qrmenu/ui';

export async function getVapidPublicKey(): Promise<string> {
  const { data } = await ownerApi.get<{ public_key: string }>('/api/v1/push/vapid-public-key');
  return data.public_key;
}

export async function subscribePush(sub: WebPushSubscription, deviceLabel: string): Promise<void> {
  await ownerApi.post('/api/v1/push/subscribe', {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    device_label: deviceLabel,
  });
}

export async function unsubscribePush(endpoint: string): Promise<void> {
  await ownerApi.delete('/api/v1/push/unsubscribe', { data: { endpoint } });
}
