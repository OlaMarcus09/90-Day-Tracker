// Bump this on every deploy that changes cache behavior — forces old clients to drop stale caches.
const CACHE_NAME = 'tracker90-v2'
const ASSETS = ['/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only GET requests are cacheable — POST/PUT/DELETE (like Supabase writes)
  // must go straight to the network untouched, or cache.put() throws.
  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  // HTML / navigation requests: always go to the network first so a redeploy is
  // visible immediately. Only fall back to cache if the network is unreachable
  // (e.g. offline), so the app still opens with the last-known shell.
  const isNavigation = request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/manifest.webmanifest'))),
    )
    return
  }

  // Hashed static assets (JS/CSS from Vite's build) are safe to cache-first since
  // their filenames change whenever the content changes.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return response
        }),
    ),
  )
})