// @aufbau/stylesheet/plugins/worker.js

import transform       from './../index.js';
import { AufbauCache } from '@aufbau/cache';

const stylesheetCache   = new AufbauCache({ name: 'aufbau-stylesheet-cache' });
const TARGET_EXTENSIONS = ['.aufbau.css', '.ass'];
const REGEX_TARGET_EXT  = new RegExp(`(${TARGET_EXTENSIONS.map(ext => ext.replace('.', '\\.')).join('|')})$`, 'i');

function shouldIntercept (url) {
  return REGEX_TARGET_EXT.test(new URL(url).pathname);
}

/**
 * Fast string hashing function for raw CSS cache key verification
 * @param {string} str
 * @returns {string}
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

export function setupServiceWorker() {
  console.log('[@aufbau/stylesheet] worker initialized.');
  self.addEventListener('fetch', (event) => {
    const request = event.request;

    if (request.method !== 'GET' || !shouldIntercept(request.url)) return;

    event.respondWith(
      (async () => {
        const cacheKey = `css:${request.url}`;
        
        // 1. Try serving from @aufbau/cache first for ultra-fast response
        const cachedCss = await stylesheetCache.get(cacheKey);

        if (cachedCss) {
          // Trigger background revalidation asynchronously
          fetchAndRevalidate(request, cacheKey);
          return new Response(cachedCss, {
            headers: { 'Content-Type': 'text/css; charset=utf-8' }
          });
        }

        // 2. Cache miss: fetch, transform, and store
        return fetchAndRevalidate(request, cacheKey);
      })()
    );
  });
}

/**
 * Fetches the network response, transforms CSS if updated, and updates @aufbau/cache
 * @param {Request} request
 * @param {string} cacheKey
 * @returns {Promise<Response>}
 */
async function fetchAndRevalidate(request, cacheKey) {
  try {
    const networkResponse = await fetch(request);
    if (!networkResponse.ok) return networkResponse;

    const rawCode = await networkResponse.text();
    const contentHash = simpleHash(rawCode);
    const hashKey     = `${cacheKey}:hash`;

    // Check if underlying source code has changed
    const previousHash = await stylesheetCache.get(hashKey);
    let transformedCss;

    if (previousHash === contentHash) {
      transformedCss = await stylesheetCache.get(cacheKey);
    }

    if (!transformedCss) {
      transformedCss = transform(rawCode);
      await stylesheetCache.set(hashKey, contentHash);
      await stylesheetCache.set(cacheKey, transformedCss);
    }

    return new Response(transformedCss, {
      headers: { 'Content-Type': 'text/css; charset=utf-8' }
    });
  } catch (err) {
    console.error('[Aufbau Worker] Fetch/Transform Error:', err);
    const fallbackCss = await stylesheetCache.get(cacheKey);
    return fallbackCss
      ? new Response(fallbackCss, { headers: { 'Content-Type': 'text/css; charset=utf-8' } })
      : new Response('/* Aufbau SW Fetch Error */', { status: 500 });
  }
}

if (typeof self !== 'undefined' && typeof window === 'undefined') {
  setupServiceWorker();
}
