/* MM Chats Center — Service Worker v1.0 */
const CACHE  = 'mmchats-v1';
const ASSETS = ['/', '/index.html', '/admin.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  /* Cache-first for same-origin HTML/CSS/JS, network-first for API calls */
  if (e.request.url.includes('firebase') || e.request.url.includes('api.telegram')) {
    return; /* Always network for API calls */
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (!resp || resp.status !== 200 || resp.type === 'opaque') return resp;
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return resp;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
