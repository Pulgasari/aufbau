// @aufbau/runtime/worker.js

import transformStylesheet from '@aufbau/stylesheet';
import { createCache }     from '@bunker/cache';

const TARGET_EXTENSIONS   = ['.aufbau.css', '.ass'];
const REGEX_TARGET_EXT    = new RegExp(`(${TARGET_EXTENSIONS.map(ext => ext.replace('.', '\\.')).join('|')})$`, 'i');
const REGEX_FONT_EXT      = /\.(woff2?|otf|ttf)$/i;
const REGEX_AUFBAU_MODULE = /(\/@aufbau\/|github\.io\/aufbau\/|\/kits\/|\/elements\/.*\.js$)/;
const MODULE_CACHE_NAME   = 'aufbau-modules-v1';
const STYLESHEET_PATTERN  = new URLPattern({ pathname: '*\\.aufbau\\.css' });
const TTL_FONT            = 30 * 24 * 60 * 60 * 1000;
const TTL_STYLESHEET      = 60 * 1000;

const       fontCache = createCache({ name: 'aufbau-fonts' });
const stylesheetCache = createCache({ name: 'aufbau-stylesheets' });

/**
 * Service Worker fetch handler for intercepting .aufbau.css / .ass network requests.
 * @param {FetchEvent} event
 * @returns {Promise<Response>|null}
 */
async function interceptFetchStylesheet ({ request }) {
  if (request.method !== 'GET')              return null;
  if (!STYLESHEET_PATTERN.test(request.url)) return null;
  //if (!REGEX_TARGET_EXT.test(new URL(request.url).pathname)) return null;

  try {
    return await stylesheetCache.staleWhileRevalidate(request, {
      transform : transformStylesheet,
      ttl  : TTL_STYLESHEET,
      type : 'text/css; charset=utf-8',
    });
  }
  catch (e) { errorLog ('stylesheet fetch failed', e); return null; }
}

/**
 * Service Worker fetch handler for font files.
 *
 * Serving the woff2 from cache leaves the browser's font pipeline completely
 * untouched, so `font-display` and `unicode-range` keep working. Registering a
 * FontFace from an ArrayBuffer in JS would give up both.
 *
 * @param {FetchEvent} event
 * @returns {Promise<Response>|null}
 */
async function interceptFetchFont ({ request }) {
  if (request.method !== 'GET') return null;
  if (!REGEX_FONT_EXT.test(new URL(request.url).pathname)) return null;

  try       { return await fontCache.staleWhileRevalidate(request, { ttl: TTL_FONT }); }
  catch (e) { errorLog ('font fetch failed', e); return null; }
}

/**
 * Helper function for dedicated Web Workers to parse stylesheet content off the main thread.
 * @param {string} ass
 * @returns {string} Transformed CSS
 */
function parseStylesheetWorkerMessage (ass) {
  return ass ? transformStylesheet(ass) : '';
}

/**
 * Intercepts requests for JavaScript modules and serves them Cache-First.
 * @param {FetchEvent} event
 * @returns {Promise<Response|null>}
 */
async function interceptFetchModule ({ request }) {
  // Only intercept GET requests matching our module pattern
  if (request.method === 'GET' && REGEX_AUFBAU_MODULE.test(request.url)) {
    const cache          = await caches.open(MODULE_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    // 1. serve immediately from cache if available
    if (cachedResponse) return cachedResponse;

    // 2. otherwise fetch from network and store in cache
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) cache.put(request, networkResponse.clone());
      return networkResponse;
    } 
    //catch (error) { console.error('Failed to fetch JS module:', error); }
    catch (error) { errorLog('JS module fetch failed', error); }
  }

  return null;
}

// :::::: HELPERS

function errorLog (message, error) {
  console.error(`[@aufbau/worker] ${message}:`, error);
}

// :::::: EXPORTS

export { 
  fontCache,
  stylesheetCache,

  interceptFetchFont,
  interceptFetchModule,
  interceptFetchStylesheet,
  
  parseStylesheetWorkerMessage,
};

// File: aufbau/plugins/worker/index.js

const CACHE_NAME = 'aufbau-css-v1';

export function initWorker() {
  // 1. Intercept .aufbau.css network requests
  self.addEventListener('fetch', (event) => {
    if (event.request.url.endsWith('.aufbau.css')) {
      event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
          const cachedResponse = await cache.match(event.request);
          return cachedResponse ?? fetch(event.request);
        })
      );
    }
  });
}






// ::: WORKERS STUFF

// combined master fetch handler for service workers
// checks all registered aufbau plugins in sequence
export async function interceptFetch (event) {
  // 1. stylesheet plugin
  const stylesheetResponse = await aufbauPluginsWorker.interceptFetchStylesheet(event);
  if (stylesheetResponse) return stylesheetResponse;

  // 2. fonts. cached as responses, so the browser's font pipeline is untouched
  //    and font-display / unicode-range keep working
  const fontResponse = await aufbauPluginsWorker.interceptFetchFont(event);
  if (fontResponse) return fontResponse;

  // 3. JS modules & CDN assets (Runtime Caching)
  const moduleResponse = await aufbauPluginsWorker.interceptFetchModule(event);
  if (moduleResponse) return moduleResponse;

  return null;
}

/*
// poo/playground/sw.js

import { interceptFetch } from '@aufbau/kit';

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      // Intercept Aufbau stylesheets and assets
      const aufbauResponse = await interceptFetch(event);
      if (aufbauResponse) return aufbauResponse;

      // Fallback to network fetch
      return fetch(event.request);
    })()
  );
});
*/

// maybe: register service worker. classic, NOT type: 'module' — a worker has no
// import map, so the aufbau worker shares code through importScripts() instead,
// and that exists only in a classic worker. see @aufbau/sw.js.
//if (sw) globalThis.navigator?.serviceWorker?.register(sw).catch(console.error);
// aufbau/docs/sw.js  als modul
//import { aufbauServiceWorker } from '../sw.js';
//aufbauServiceWorker({ precache: ['../js/index.js', '../kits/preact-htm.js'] });
