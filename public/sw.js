// Bump this on every deploy that changes cache behavior — forces old clients to drop stale caches.
const CACHE_NAME = 'compound-v1'
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

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (!request.url.startsWith('http') || url.origin !== self.location.origin) {
    return
  }

  const isNavigation = request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')

  if (isNavigation) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/manifest.webmanifest'))),
    )
    return
  }

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

// --- Web push -------------------------------------------------------------
// The server (Supabase Edge Function) sends a JSON payload: { title, body, url }.
// We fall back to sensible defaults if the payload is missing or unparseable so
// a malformed push still produces a usable notification rather than nothing.
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }

  const title = data.title || 'Compound'
  const options = {
    body: data.body || "Don't break the chain — check off today.",
    icon: '/tracker-icon.svg',
    badge: '/tracker-icon.svg',
    data: { url: data.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Tapping a notification focuses an already-open tab if there is one, otherwise
// opens a fresh one — avoids stacking duplicate app tabs.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    }),
  )
})