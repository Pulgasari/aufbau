// aufbau/docs/sw.js

// :::::: CACHE

import createCache from './../runtime/cache.js';
const cssCache = createCache({ name: 'css' });

// :::::: DEBUGGER

const DEBUG = true;
const debug = {
  log  : (...args) => DEBUG && console.log  (`[SW]`, ...args),
  info : (...args) => DEBUG && console.info (`[SW]`, ...args),
  warn : (...args) => DEBUG && console.warn (`[SW]`, ...args),
};


// :::::: HASHING

const stableStringify = (value) =>
    typeof value === 'string'                    ? value
  : value === null || typeof value !== 'object'  ? String(value)
  : Array.isArray(value)                         ? `[${value.map(stableStringify).join(',')}]`
  : `{${Object.keys(value).sort().map(key => `${key}:${stableStringify(value[key])}`).join(',')}}`;

const hash = (value) => {
  const text = typeof value === 'string' ? value : stableStringify(value);
  let result = 5381;
  let index  = text.length;
  while (index) result = (result * 33) ^ text.charCodeAt(--index);
  return result >>> 0;
};

const hashKey = (value) => hash(value).toString(36);

function hashCode (s) {
  for (let i = 0, h = 0; i < s.length; i++)
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return h;
}

// ::::::

debug.log('createCache TOPLEVEL:', !!createCache);

self.addEventListener('fetch', async (event) => {
  const url           = event.request.url;
  const isAufbauStyle = url.endsWith('.aufbau.css') || url.endsWith('.ass');

  if (isAufbauStyle) {
    debug.log('AufbauStylesheet detected:', url);
    debug.log('createCache:', !!createCache);
    if (caches) debug.log('caches:', caches);

    const cssFileKey1 = hashKey  (url);
    const cssFileKey2 = hashCode (url);
    const cacheResult = await cssCache.get(cssFileKey1);
    
    debug.log('cssFileKey1:', cssFileKey1);
    debug.log('cssFileKey2:', cssFileKey2);
    debug.log('has cacheResult:', !!cacheResult);
    debug.log('cacheResult:', cacheResult);
    
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
