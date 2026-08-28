const CACHE_NAME = 'melation-sound-shell-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.destination === 'audio' || request.url.includes('firestore.googleapis.com')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(request, copy)); return response; }).catch(() => caches.match(request).then(response => response || caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(request, copy)); return response; })));
});
