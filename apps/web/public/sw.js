// Offline cache for the app shell and scripts. API calls (/v1/) are
// never cached here: offline writes go through the IndexedDB outbox instead.
const CACHE = 'astro-med-v1';
const IMMUTABLE = /^\/_astro\//;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const { urls } = await (await fetch('/precache.json', { cache: 'no-store' })).json();
      await Promise.all(
        urls.map(async (url) => {
          if (IMMUTABLE.test(url) && (await cache.match(url))) return;
          await cache.add(url).catch(() => {}); // one failed asset must not block installation
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/v1/')) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(event.request, { ignoreSearch: true });
      if (cached && IMMUTABLE.test(url.pathname)) return cached;
      try {
        const res = await fetch(event.request);
        if (res.ok && !url.search) cache.put(event.request, res.clone());
        if (res.status >= 500 && cached) return cached;
        return res;
      } catch (error) {
        if (cached) return cached;
        throw error;
      }
    })(),
  );
});
