// aufbau/docs/sw.js

// :::::: CACHE

import { createCache, createResponseCache } from './../runtime/cache.js';
import transformACSS from './../stylesheet/index.js';

const cssCache = createCache({ name: 'css' });
const  jsCache = createResponseCache({ name: 'js' });

// :::::: CACHE CONFIG

const CACHE = { css: false, js: true };

// :::::: DEBUGGER

const DEBUG = true;
const debug = {
  log  : (...args) => DEBUG && console.log  (`[SW]`, ...args),
  info : (...args) => DEBUG && console.info (`[SW]`, ...args),
  warn : (...args) => DEBUG && console.warn (`[SW]`, ...args),
};

// :::::: HANDLERS

const cssHeaders = { 'Content-Type': 'text/css; charset=utf-8' };

//const isStyle  = (path)          => path.endsWith('.aufbau.css') || path.endsWith('.ass');
const isScript = (request, path) => request.destination === 'script' || path.endsWith('.js');

/*
const handleStyle = async (event) => {
  const request = event.request;

  // the transform is mandatory, only the cache layer is optional
  if (!CACHE.css) {
    const response = await fetch(request);
    if (!response.ok) return response;
    return new Response(await transformACSS(await response.text()), { headers: cssHeaders });
  }

  const { cached, pulled } = await cssCache.getAndPull(request.url, { transform: transformACSS, type: 'text/css' });
  event.waitUntil(pulled); // keep the sw alive for the background revalidation
  if (cached) return new Response(cached, { headers: cssHeaders });

  const fresh = await pulled;
  return fresh ? new Response(fresh, { headers: cssHeaders }) : fetch(request);
};
*/
const handleScript = async (event) => {
  const request = event.request;
  if (!CACHE.js) return fetch(request); // transparent passthrough while the layer is off

  const { cached, pulled } = await jsCache.getAndPull(request);
  event.waitUntil(pulled);
  if (cached) return cached;
  return (await pulled) ?? fetch(request); // cold start, or surface the real error response
};

// :::::: LISTENERS

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

//if (CACHE.css && isStyle(url.pathname))           return event.respondWith(handleStyle(event));
  if (isScript(request, url.pathname)) {
    debug.log('js detected:', url.pathname, CACHE.js ? '(cached)' : '(passthrough)');
    if (CACHE.js) return event.respondWith(handleScript(event));
  }
});

/*
self.addEventListener('message', (event) => {
  const { type, layer, value } = event.data ?? {};

  event.waitUntil((async () => {
    if (type === 'layer') {
      const next = { ...(await getConfig()), [layer]: value };
      config = Promise.resolve(next);
      await configCache.set('layers', JSON.stringify(next), { type: 'application/json' });
      if (!value) await (layer === 'css' ? cssCache : jsCache).clear(); // drop stale entries when a layer goes off
      debug.log('layers', next);
    }
    if (type === 'clear') await Promise.all([cssCache.clear(), jsCache.clear()]);
  })());
});
*/

// :::::: FETCH LISTENER

/*
self.addEventListener('fetch', (event) => {
  const url           = event.request.url;
  const isAufbauStyle = url.endsWith('.aufbau.css') || url.endsWith('.ass');

  if (isAufbauStyle) {
    debug.log('AufbauStylesheet detected:', url);
    logAllCacheEntries();
    
    event.respondWith((async () => {
      // 1. check if cached version is immediately available
      const cachedData = await cssCache.getMeta(event.request);

      // 2. STALE: if cached, serve immediately and trigger background check
      if (cachedData?.content) {
        debug.log('Serving instantly from cache:', url);
        
        // Keep SW alive until background task finishes
        event.waitUntil(revalidateInBackground());

        return new Response (cachedData.content, {headers: { 'Content-Type': 'text/css; charset=utf-8' }});
      }

      // 3. CACHE MISS: must fetch and transform before responding
      debug.log('Initial cache miss. Fetching and transforming:', url);
      const networkResponse = await fetch(event.request);
      const rawCss          = await networkResponse.text();
      const currentHash     = getContentHash(rawCss);
      const transformedCss  = await transformACSS(rawCss);

      await cssCache.setMeta(event.request, transformedCss, currentHash);

      return new Response (transformedCss, { headers: { 'Content-Type': 'text/css; charset=utf-8' }});
    })());
  }
  
});
*/


/*

// :::::: CACHE

import createCache   from './../runtime/cache.js';
import transformACSS from './../stylesheet/index.js';

const cssCache = createCache({ name: 'css' });
const hashCode = (str) => [...str].reduce((s,c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0);

// :::::: DEBUGGER

const DEBUG = true;
const debug = {
  log  : (...args) => DEBUG && console.log  (`[SW]`, ...args),
  info : (...args) => DEBUG && console.info (`[SW]`, ...args),
  warn : (...args) => DEBUG && console.warn (`[SW]`, ...args),
};



// ::::::

debug.log('createCache TOPLEVEL:', !!createCache);

self.addEventListener('fetch', async (event) => {
  const url           = event.request.url;
  const isAufbauStyle = url.endsWith('.aufbau.css') || url.endsWith('.ass');

  if (isAufbauStyle) {
    debug.log('AufbauStylesheet detected:', url);
    debug.log('createCache:', !!createCache);
    if (caches) debug.log('caches:', caches);

    const cssFileKey  = hashCode(url);
    const cacheResult = await cssCache.get(cssFileKey);
    
    debug.log('cssFileKey:', cssFileKey);
    debug.log('has cacheResult:', !!cacheResult);
    debug.log('cacheResult:', cacheResult);

    
  }
  
});

*/


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
