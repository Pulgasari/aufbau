// aufbau/docs/sw.js

import createCache from './../runtime/cache.js';

const DEBUG = true;
const debug = {
  log  : (...args) => DEBUG && console.log  (`[SW]`, ...args),
  warn : (...args) => DEBUG && console.warn (`[SW]`, ...args),
};

debug.log('createCache TOPLEVEL:', !!createCache);

self.addEventListener('fetch', (event) => {
  debug.log('FetchRequest detected.');
  
  const url           = event.request.url;
  const isAufbauStyle = url.endsWith('.aufbau.css') || url.endsWith('.ass');

  if (isAufbauStyle) {
    debug.log('AufbauStylesheet detected:', url);
    debug.log('createCache:', !!createCache);
    if (createCache) console.log('[SW] createCache available.');
    if (createCache) console.log(createCache);
    if (caches) console.log('caches:', caches);
  }
  
});


/*

import transformACSS from '@aufbau/stylesheet';

const CSS_CACHE = 'aufbau-compiled-css-v1';

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  const isAufbauStyle = url.endsWith('.aufbau.css') || url.endsWith('.ass');

  if (isAufbauStyle) {
    event.respondWith(
      caches.open(CSS_CACHE).then(async (cache) => {
        // 1. Check if we already have the compiled CSS Response in CacheStorage
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          // Serve compiled CSS instantly to the browser (0ms, no DOM manipulation!)
          return cachedResponse;
        }

        // 2. Otherwise fetch the raw source from server
        const rawResponse = await fetch(event.request);
        const sourceText  = await rawResponse.text();

        // 3. Compile raw dialect to native CSS
        const compiledCss = transformACSS(sourceText);

        // 4. Create a synthetic HTTP response with 'text/css'
        const cssResponse = new Response(compiledCss, {
          headers: { 'Content-Type': 'text/css; charset=utf-8' }
        });

        // 5. Save synthetic response to CacheStorage and return it
        cache.put(event.request, cssResponse.clone());
        return cssResponse;
      })
    );
  }
});

*/


/*
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
*/

/*
// Component.js in your framework
async function loadComponentStyle(cssUrl) {
  // Service worker will handle this fetch with SWR as well
  const response = await fetch(cssUrl);
  const cssText = await response.text();

  const sheet = new CSSStyleSheet();
  await sheet.replace(cssText);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
}
*/


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
