// Service worker — push notifications only. No caching, no fetch interception.

self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });

self.addEventListener('push', (event) => {
  let title = 'QR Меню';
  let body = '';
  let data = {};

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title ?? title;
      body = payload.body ?? '';
      data = payload.data ?? {};
    } catch {
      body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ('focus' in client) return client.focus();
        }
        return self.clients.openWindow('/');
      })
  );
});
