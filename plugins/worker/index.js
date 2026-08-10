// @aufbau/plugins/worker

import transform from '@aufbau/stylesheet';
import { createFiles } from '@bunker/files';

const TARGET_EXTENSIONS = ['.aufbau.css', '.ass'];
const REGEX_TARGET_EXT  = new RegExp(`(${TARGET_EXTENSIONS.map(ext => ext.replace('.', '\\.')).join('|')})$`, 'i');
const REGEX_FONT_EXT    = /\.(woff2?|otf|ttf)$/i;

// a service worker answering this request from cache is the only arrangement in
// which the <link> stays an ordinary render-blocking link and still resolves
// instantly. no javascript on the critical path, so nothing can flash.
const files = createFiles({ name: 'aufbau-stylesheets' });
const fontFiles = createFiles({ name: 'aufbau-fonts' });

// how long a cached sheet is served without even asking. beyond it the cached copy
// still goes out immediately, with a conditional revalidation behind it.
const TTL = 60 * 1000;

// fonts are content-addressed by url in practice — a rebuild ships a new filename —
// so there is nothing to gain from asking about them often.
const FONT_TTL = 30 * 24 * 60 * 60 * 1000;

export { files, fontFiles };

/**
 * Service Worker fetch handler for intercepting .aufbau.css / .ass network requests.
 * @param {FetchEvent} event
 * @returns {Promise<Response>|null}
 */
export async function interceptFetchStylesheet (event) {
  const request = event.request;
  if (request.method !== 'GET') return null;
  if (!REGEX_TARGET_EXT.test(new URL(request.url).pathname)) return null;

  try {
    return await files.staleWhileRevalidate(request, {
      transform : (source) => transform(source),
      ttl       : TTL,
      type      : 'text/css; charset=utf-8',
    });
  } catch (error) {
    // a cold cache plus a dead network. hand the request back so the browser can
    // fail it the way it normally would.
    console.error('[@aufbau/plugins/worker] stylesheet fetch failed:', error);
    return null;
  }
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
export async function interceptFetchFont (event) {
  const request = event.request;
  if (request.method !== 'GET') return null;
  if (!REGEX_FONT_EXT.test(new URL(request.url).pathname)) return null;

  try {
    return await fontFiles.staleWhileRevalidate(request, { ttl: FONT_TTL });
  } catch (error) {
    console.error('[@aufbau/plugins/worker] font fetch failed:', error);
    return null;
  }
}

/**
 * Helper function for dedicated Web Workers to parse stylesheet content off the main thread.
 * @param {string} ass
 * @returns {string} Transformed CSS
 */
export function parseStylesheetWorkerMessage (ass) {
  return ass ? transform(ass) : '';
}

const MODULE_CACHE_NAME = 'aufbau-modules-v1';

// Matches local or CDN module URLs for aufbau packages
const AUFBAU_MODULE_PATTERN = /(\/@aufbau\/|github\.io\/aufbau\/|\/kits\/|\/elements\/.*\.js$)/;

/**
 * Intercepts requests for JavaScript modules and serves them Cache-First.
 * @param {FetchEvent} event
 * @returns {Promise<Response|null>}
 */
export async function interceptFetchModule(event) {
  const request = event.request;

  // Only intercept GET requests matching our module pattern
  if (request.method === 'GET' && AUFBAU_MODULE_PATTERN.test(request.url)) {
    const cache = await caches.open(MODULE_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    // 1. Serve immediately from cache if available
    if (cachedResponse) {
      return cachedResponse;
    }

    // 2. Otherwise fetch from network and store in cache
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      console.error('Failed to fetch JS module:', error);
    }
  }

  return null;
}

