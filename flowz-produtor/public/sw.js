// BUILD_ID is replaced on every build by scripts/stamp-sw.mjs so each deploy
// produces a byte-different sw.js and browsers detect a new SW automatically.
const BUILD_ID = '__BUILD_ID__';
const CACHE_VERSION = `tesla-${BUILD_ID}`;
const CACHE_STATIC = `${CACHE_VERSION}-static`;

console.log('[SW] loaded', { BUILD_ID });

// Install: skip waiting immediately — do NOT pre-cache index.html here.
// Pre-caching would lock in the old HTML before network-first can serve the new one,
// causing a stale-cache race on first load after a new deploy.
self.addEventListener('install', (e) => {
  console.log('[SW] install', { BUILD_ID });
  e.waitUntil(self.skipWaiting());
});

// Activate: delete ALL old caches, claim clients, reload all open windows
self.addEventListener('activate', (e) => {
  console.log('[SW] activate', { BUILD_ID });
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then((cs) => cs.forEach((c) => c.postMessage({ type: 'RELOAD' })))
  );
});

// Message: allow the app to force skip waiting / purge caches / schedule notifications
self.addEventListener('message', (e) => {
  const type = e.data && e.data.type;
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (type === 'CLEAR_CACHES') {
    e.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => self.clients.matchAll({ type: 'window' }))
        .then((cs) => cs.forEach((c) => c.postMessage({ type: 'RELOAD' })))
    );
  } else if (type === 'SCHEDULE_NOTIFICATION') {
    // O SW continua vivo em background, então o setTimeout aqui dispara mesmo
    // quando a aba está suspensa (diferente do setTimeout na main thread).
    const { id, title, body, icon, delayMs } = e.data;
    if (typeof delayMs !== 'number' || delayMs < 0) return;
    setTimeout(() => {
      self.registration.showNotification(title || 'FocusFlow', {
        body: body || '',
        icon: icon || '/assets/icon.png',
        badge: '/assets/icon.png',
        tag: id,
        data: { id },
        vibrate: [200, 100, 200],
      });
    }, delayMs);
  }
});

// Toque na notificação: foca a aba existente ou abre uma nova
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      const open = cs.find((c) => 'focus' in c);
      if (open) return open.focus();
      return self.clients.openWindow('/');
    })
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET and cross-origin (e.g. Supabase API calls)
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // HTML + JS + CSS: network-first so new deploys always take effect
  if (
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  ) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_STATIC).then((c) => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Everything else (images, fonts, icons): cache-first
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_STATIC).then((c) => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
