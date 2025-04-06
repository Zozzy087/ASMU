const CACHE_NAME = 'flipbook-cache-dynamic-v1';

self.addEventListener('install', function (event) {
  self.skipWaiting(); // ne várjon aktiválásra
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.filter(function (cacheName) {
          return cacheName !== CACHE_NAME;
        }).map(function (cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      // Ha benne van a cache-ben → használjuk
      if (response) {
        return response;
      }

      // Ha nincs benne → hálózatról kérjük le, majd elmentjük
      return fetch(event.request).then(function (response) {
        // Csak sikeres (200-as) válaszokat cache-elünk
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, responseClone);
        });

        return response;
      }).catch(function () {
        // Ha offline vagyunk → adjunk vissza egy alapértelmezett képet vagy oldalt
        return caches.match('files/icon-512.png');
      });
    })
  );
});
