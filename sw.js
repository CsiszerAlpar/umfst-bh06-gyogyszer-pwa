const CACHE_NAME = 'gyogyszer-v1';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Biztonságosabb cache-elés (hogy egy hiba ne rontsa el az egészet)
      return Promise.all(
        APP_SHELL.map((url) => {
          return fetch(url).then((response) => {
            if (!response.ok) throw new Error(`Failed to fetch ${url}`);
            return cache.put(url, response);
          }).catch((err) => {
            console.warn('Cache-elés figyelmeztetés:', err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Külön stratégia az API adatokhoz (Network First, fallback to cache)
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request)
        .then((resp) => {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, respClone);
          });
          return resp;
        })
        .catch(() => {
          return caches.match(e.request);
        })
    );
    return;
  }

  // Alapértelmezett stratégia az App Shell-hez (Cache First, fallback to network)
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).then((resp) => {
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, respClone));
        return resp;
      });
    })
  );
});