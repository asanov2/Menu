export type PushStatus = 'unsupported' | 'denied' | 'default' | 'subscribed';

export function getDeviceLabel(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS / Safari';
  if (/Android/.test(ua)) return `Android / ${/Chrome/.test(ua) ? 'Chrome' : 'Browser'}`;
  const b = /Edg/.test(ua) ? 'Edge' : /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Browser';
  return `Desktop / ${b}`;
}

export interface WebPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf;
}

export async function getPushStatus(
  checkSubscribed?: (endpoint: string) => Promise<boolean>,
): Promise<PushStatus> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      if (checkSubscribed) {
        try {
          return (await checkSubscribed(sub.endpoint)) ? 'subscribed' : 'default';
        } catch {
          // notification-service unreachable → fail-open, show Enable button
          return 'default';
        }
      }
      return 'subscribed';
    }
  } catch {
    // SW not ready → treat as not subscribed
  }
  return 'default';
}

export async function subscribeToPush(vapidPublicKey: string): Promise<WebPushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    const json = sub.toJSON();
    if (!json.endpoint) return null;
    const keys = json.keys as Record<string, string> | undefined;
    if (!keys?.p256dh || !keys?.auth) return null;
    return { endpoint: json.endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } };
  } catch {
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<string | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return null;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    return endpoint;
  } catch {
    return null;
  }
}
