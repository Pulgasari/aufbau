// aufbau/docs/sw.js

const CSS_CACHE_NAME = 'framework-css-v1';

self.addEventListener('fetch', (event) => {
  const isCssRequest = event.request.destination === 'style' || event.request.url.endsWith('.css');   

  if (isCssRequest) {
    event.respondWith(
      caches.open(CSS_CACHE_NAME).then(async (cache) => {
        // 1. Serve immediately from CacheStorage for instant, flicker-free render
        const cachedResponse = await cache.match(event.request);

        // 2. Background revalidation against the server
        const networkFetch = fetch(event.request, { cache: 'no-cache' })
          .then((networkResponse) => {
            // Update cache in background if content changed
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((err) => {
            // Offline fallback or network error handling
            console.debug('Background CSS sync skipped (offline)', err);
          });

        // Return cached CSS instantly, or wait for network on absolute first page load
        return cachedResponse || networkFetch;
      })
    );
  }
});


/*
classic script on purpose — a service worker has no import map, so bare specifiers
never resolve there. importScripts() performs no specifier resolution at all and
is how a worker shares code. see ../sw.js for the reasoning in full.

register WITHOUT type: 'module'.

importScripts('../sw.js');

aufbauServiceWorker({
  // highest fan-in modules of this page's graph, measured with aufbau/test/graph.mjs
  precache: [
    '../js/index.js',
    '../kits/preact-htm.js',
    '../../domina/core/index.js',
  ],
});
*/
