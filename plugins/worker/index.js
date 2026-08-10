// @aufbau/plugins/worker

import transformStylesheet from '@aufbau/stylesheet';
import { createFiles }     from '@bunker/files';

const TARGET_EXTENSIONS   = ['.aufbau.css', '.ass'];
const REGEX_TARGET_EXT    = new RegExp(`(${TARGET_EXTENSIONS.map(ext => ext.replace('.', '\\.')).join('|')})$`, 'i');
const REGEX_FONT_EXT      = /\.(woff2?|otf|ttf)$/i;
const REGEX_AUFBAU_MODULE = /(\/@aufbau\/|github\.io\/aufbau\/|\/kits\/|\/elements\/.*\.js$)/;
const MODULE_CACHE_NAME   = 'aufbau-modules-v1';

// a service worker answering this request from cache is the only arrangement in
// which the <link> stays an ordinary render-blocking link and still resolves
// instantly. no javascript on the critical path, so nothing can flash.
const stylesheetFiles = createFiles({ name: 'aufbau-stylesheets' });
const       fontFiles = createFiles({ name: 'aufbau-fonts' });

// how long a cached sheet is served without even asking. beyond it the cached copy still goes out immediately, with a conditional revalidation behind it.
// fonts are content-addressed by url in practice — a rebuild ships a new filename — so there is nothing to gain from asking about them often.    
const TTL_FONT       = 30 * 24 * 60 * 60 * 1000;
const TTL_STYLESHEET = 60 * 1000;


/**
 * Service Worker fetch handler for intercepting .aufbau.css / .ass network requests.
 * @param {FetchEvent} event
 * @returns {Promise<Response>|null}
 */
async function interceptFetchStylesheet (event) {
  const request = event.request;
  if (request.method !== 'GET') return null;
  if (!REGEX_TARGET_EXT.test(new URL(request.url).pathname)) return null;

  try {
    return await stylesheetFiles.staleWhileRevalidate(request, {
      transform : (source) => transformStylesheet(source),
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
async function interceptFetchFont (event) {
  const request = event.request;
  if (request.method !== 'GET') return null;
  if (!REGEX_FONT_EXT.test(new URL(request.url).pathname)) return null;

  try       { return await fontFiles.staleWhileRevalidate(request, { ttl: TTL_FONT }); }
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
async function interceptFetchModule (event) {
  const request = event.request;

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
  console.error(`[@aufbau/plugins/worker] ${message}:`, error);
}

// :::::: EXPORTS

export { 
  files: stylesheetFiles, 
  fontFiles,
  stylesheetFiles,

  interceptFetchFont,
  interceptFetchModule,
  interceptFetchStylesheet,
  
  parseStylesheetWorkerMessage,
};
