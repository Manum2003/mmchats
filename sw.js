/* MM Chats Center — Service Worker
   Minimal app-shell caching. This file MUST be served from the site root
   (https://mmchats.in/sw.js) — NOT from a subfolder — or its scope will be
   limited and the browser will not treat the site as installable. */

const CACHE_NAME = 'mmchats-shell-v1';
const SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

/* Install — pre-cache the app shell */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

/* Activate — clean up old cache versions */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* Fetch — network first, fall back to cache (so menu/prices stay fresh,
   but the app still opens if the network is briefly unavailable) */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
