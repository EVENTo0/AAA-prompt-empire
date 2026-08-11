/* EVENTO offline shell.
   Rules that must not regress:
   - never cache /api responses (they are authenticated or per-request);
   - never cache the account area;
   - navigations are network-first with an offline fallback, so a cached page
     can never be shown as if it were live. */

const CACHE = 'evento-shell-v1'
const OFFLINE_PATHS = ['/ar/offline', '/en/offline']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(OFFLINE_PATHS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

function offlineFallbackFor(pathname) {
  return pathname.startsWith('/en') ? '/en/offline' : '/ar/offline'
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.includes('/account')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(offlineFallbackFor(url.pathname)).then((cached) => cached || Response.error()),
      ),
    )
    return
  }

  if (url.pathname.startsWith('/_next/static/') || url.pathname.endsWith('.svg')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone()
              caches.open(CACHE).then((cache) => cache.put(request, copy))
            }
            return response
          }),
      ),
    )
  }
})
