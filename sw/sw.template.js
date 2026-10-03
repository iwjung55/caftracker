/*
 * Caffeine Recorder service worker — generated at build time by the
 * `service-worker` plugin in vite.config.ts (do not edit dist/sw.js).
 *
 * Caches only the app shell: code, styles, fonts, icons. Never user data,
 * which lives in IndexedDB and is untouched by this file.
 *
 * - Page loads: network first, so a new deploy shows up immediately;
 *   the cached shell when offline.
 * - Everything else (hashed assets, fonts, icons): cache first. Hashed
 *   filenames change whenever content does, so this never serves stale code.
 */
const VERSION = '__VERSION__';
const CACHE = `shell-${VERSION}`;
const PRECACHE = __PRECACHE__;
const scoped = (path) => new URL(path, self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map(scoped)))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('shell-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(scoped('./'), copy));
          }
          return response;
        })
        .catch(() => caches.match(scoped('./'))),
    );
    return;
  }

  event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
});
