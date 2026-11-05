const CACHE_NAME = 'levistone-navi-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/@phosphor-icons/web',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap'
];

// Install Event: Pre-cache critical files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache-First strategy with network fallback
self.addEventListener('fetch', (event) => {
  // Pass through Nominatim search queries directly to network
  if (event.request.url.includes('nominatim.openstreetmap.org')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache dynamic external font files if requested
        if (
          networkResponse.ok &&
          (event.request.url.includes('fonts.gstatic.com') ||
           event.request.url.includes('cdn.tailwindcss.com') ||
           event.request.url.includes('unpkg.com'))
        ) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for offline root access
        return caches.match('./index.html');
      });
    })
  );
});
