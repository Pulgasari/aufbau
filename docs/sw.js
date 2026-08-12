// aufbau/docs/sw.js

// :::::: CACHE

import createCache   from './../runtime/cache.js';
import transformACSS from './../stylesheet/index.js';

const cssCache = createCache({ name: 'css' });
const getContentHash = (str) => [...str].reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0).toString(36);

// function to revalidate content in the background
const revalidateInBackground = async () => {
  try {
    const networkResponse = await fetch(event.request);
    const rawCSS          = await networkResponse.text();
    const currentHash     = getContentHash(rawCSS);

    // update cache only if content hash has changed or no cached version exists
    if (!cachedData || cachedData.hash !== currentHash) {
      debug.log('Source changed or missing. Re-transforming in background:', url);
      const transformedCss = await transformACSS(rawCss);
      await cssCache.setMeta(event.request, transformedCss, currentHash);
    } else {
      debug.log('cache is up to date:', url);
    }
  } catch (error) {
    debug.warn('background revalidation failed:', error);
  }
};

// :::::: DEBUGGER

const DEBUG = true;
const debug = {
  log  : (...args) => DEBUG && console.log  (`[SW]`, ...args),
  info : (...args) => DEBUG && console.info (`[SW]`, ...args),
  warn : (...args) => DEBUG && console.warn (`[SW]`, ...args),
};

// :::::: TEMP

// Inspect all caches and their stored requests
async function logAllCacheEntries () {
  // Retrieve names of all existing caches
  const cacheNames = await caches.keys();

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    // Retrieve all stored Request objects for the current cache
    const requests = await cache.keys();

    console.log(`[Cache Storage] Cache Name: ${cacheName}`);
    requests.forEach((request) => {
      console.log(`  - ${request.url}`);
    });
  }
}

// :::::: FETCH LISTENER

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
