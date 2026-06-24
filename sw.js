/* MM Chats Admin — Service Worker v1.0 */
const CACHE_NAME = 'mmchats-admin-v1';
const STATIC_ASSETS = [
  '/admin.html',
  '/manifest-admin.json',
  '/icon-192.png',
  '/icon-512.png',
];

/* Install: cache static assets */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) /* don't fail if some assets missing */
  );
});

/* Activate: delete old caches */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Fetch: cache-first for static, network-first for all live APIs.
   Admin relies on live data (orders, delivery booking, payments) —
   never serve those from cache. */
self.addEventListener('fetch', e => {
  const url = e.request.url;

  if (e.request.method !== 'GET') return;

  /* Always hit the network for anything live/dynamic */
  if (url.includes('firebase') ||
      url.includes('telegram') ||
      url.includes('porter') ||
      url.includes('shadowfax') ||
      url.includes('uber.com') ||
      url.includes('borzodelivery') ||
      url.includes('razorpay') ||
      url.includes('googleapis.com/chart')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request)
        .then(resp => {
          if (resp && resp.status === 200 && resp.type !== 'opaque') {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => null);

      return cached || fetchPromise || caches.match('/admin.html');
    })
  );
});
