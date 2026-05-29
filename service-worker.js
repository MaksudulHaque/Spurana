/* Spurana Service Worker · Beta Green L 1 (build: callpro-notify) */
const VERSION = 'beta-green-l1-cosmiccall';
const CACHE = `spurana-${VERSION}`;
const CORE = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).catch(()=>{})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE && k.startsWith('spurana-')).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  /* Network-first for HTML, cache-first for assets */
  if(req.mode === 'navigate' || req.destination === 'document'){
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy).catch(()=>{}));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
    );
  } else {
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(res => {
        if(res && res.ok){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy).catch(()=>{}));
        }
        return res;
      }).catch(() => caches.match('/index.html')))
    );
  }
});

/* ═══════════════════════════════════════════════════════════════
   PUSH NOTIFICATION HANDLERS
   ═══════════════════════════════════════════════════════════════ */

/* Server-sent push (requires VAPID setup — graceful if not configured) */
self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : 'New message' };
  }

  const title = data.title || 'Spurana ✦';
  const options = {
    body: data.body || 'A message from your beloved',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge.png',
    tag: data.tag || 'spurana-message',
    data: data.data || { url: '/' },
    requireInteraction: false,
    renotify: true,
    vibrate: [100, 50, 100, 50, 100],
    silent: false,
    actions: [
      { action: 'open', title: 'Open Spurana' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* Click on notification — focus or open the app */
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      /* If an existing tab is open, focus it */
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.postMessage({ action: 'focus', data: event.notification.data });
          return client.focus();
        }
      }
      /* Otherwise, open a new tab */
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

/* Close notification — clear badge */
self.addEventListener('notificationclose', event => {
  /* Could send analytics here if needed */
});

/* Sync events (background sync — future feature) */
self.addEventListener('sync', event => {
  if (event.tag === 'send-messages') {
    /* Future: retry failed message sends from IndexedDB queue */
  }
});

/* Listen for messages from the page (e.g., to clear badges) */
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'clearBadge'){
    if (self.navigator && self.navigator.clearAppBadge){
      self.navigator.clearAppBadge().catch(()=>{});
    }
  }
});

console.log('[SW] Spurana ' + VERSION + ' ready');
