const CACHE_NAME = 'flipbook-cache-v1';
const urlsToCache = [
  'index.html',
  'offline.html',
  'javascript/config.js',
  'javascript/LoadingJS.js',
  'style/style.css',
  'javascript/deString.js',
  'javascript/jquery-3.5.1.min.js',
  'javascript/book.min.js',
  'javascript/pageItems.min.js',
  'javascript/main.min.js',
  'javascript/flipHtml5.hiSlider2.min.js',
  'style/hiSlider2.min.css',
  'slide_javascript/slideJS.js',
  'manifest.json',
  'files/icon-512.png',
  'files/icon-192.png',
  'offline.appcache'
];


// Telepítéskor cache-eljük az alapvető erőforrásokat
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache megnyitva');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

// Aktiváláskor töröljük a régi cache-eket
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName !== CACHE_NAME;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Kérések kezelése: először a cache-ből próbáljuk kiszolgálni, 
// ha nem sikerül, akkor a hálózatról, és el is mentjük a cache-be
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Klónozzuk a kérést, mert csak egyszer használható
        var fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(function(response) {
            // Ellenőrizzük, hogy érvényes válasz-e
            if (!response || response.status !== 200) {
  return response;
}


            // Klónozzuk a választ is, mert csak egyszer használható
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                // Minden sikeres kérést és választ cache-elünk
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(function() {
            // Ha offline vagyunk és a kérés navigációs kérés
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            // Egyéb esetben próbáljunk valami alapértelmezett erőforrást adni
            return caches.match('/files/icon-512.png');
          });
      })
  );
});