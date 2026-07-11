const CACHE_NAME = 'tracker90-v2'
const RUNTIME_CACHE = 'tracker90-runtime-v2'
const ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/tracker-icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key)),
      ),
    ),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok && new URL(event.request.url).origin === self.location.origin) {
            caches
              .open(RUNTIME_CACHE)
              .then((cache) => cache.put(event.request, networkResponse.clone()))
          }
          return networkResponse
        })
        .catch(async () => {
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html')
          }
          return caches.match(event.request)
        })
    }),
  )
})
