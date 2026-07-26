// @aufbau/stylesheet/plugins/worker.js

import transform from './../index.js';

const CACHE_NAME        = 'aufbau-stylesheet-cache-v1';
const TARGET_EXTENSIONS = ['.aufbau.css', '.ass'];
const REGEX_TARGET_EXT  = new RegExp(`(${TARGET_EXTENSIONS.map(ext => ext.replace('.', '\\.')).join('|')})$`, 'i');

function shouldIntercept (url) {
  return REGEX_TARGET_EXT.test(new URL(url).pathname);
}

export function setupServiceWorker () {
  self.addEventListener('fetch', (event) => {
    const request = event.request;

    if (request.method !== 'GET' || !shouldIntercept(request.url)) return;

    event.respondWith(
      (async () => {
        const cache          = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);

        // Background Fetch & Revalidate Promise
        const fetchAndTransform = fetch(request)
          .then(async (networkResponse) => {
            if (!networkResponse.ok) return networkResponse;

            const rawCode        = await networkResponse.text();
            const transformedCss = transform(rawCode);
            const cssResponse    = new Response(transformedCss, { headers: { 'Content-Type': 'text/css; charset=utf-8' }});   

            // Put in Cache Storage
            cache.put(request, cssResponse.clone());
            return cssResponse;
          })
          .catch((err) => {
            console.error('[Aufbau Worker] Fetch Error:', err);
            return cachedResponse || new Response('/* Aufbau SW Fetch Error */', { status: 500 });
          });

        // Stale-While-Revalidate: Return cached immediately if available, else wait for fetch
        return cachedResponse || fetchAndTransform;
      })()
    );
  });
}

if (typeof self !== 'undefined' && typeof window === 'undefined') {
  setupServiceWorker();
}
