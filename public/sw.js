const CACHE_NAME = 'fp-cache-v1';
const STATIC_ASSETS = [
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.url.includes('/api/') || event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// --- Web Push Notifications ---

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const payload = event.data.json();
  const { title, body, icon, tag, data } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || '/android-chrome-192x192.png',
      tag: tag || 'default',
      data: data || {},
      badge: '/android-chrome-192x192.png',
      vibrate: [200, 100, 200],
      actions:
        data?.type === 'incoming_call'
          ? [
              { action: 'answer', title: 'Answer' },
              { action: 'decline', title: 'Decline' },
            ]
          : [],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = '/chat';

  if (data.type === 'chat_message' && data.conversationId) {
    targetUrl = `/chat?id=${data.conversationId}`;
  } else if (data.type === 'incoming_call' && data.conversationId) {
    targetUrl = `/chat?id=${data.conversationId}&call=${data.callId}`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/chat') || client.url.includes('/dashboard')) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
