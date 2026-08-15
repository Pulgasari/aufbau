// @aufbau/runtime/stylesheet.js

import * as dom        from 'https://code.pulgasari.dev/domina/core/index.js';
import { createCache } from './../../runtime/cache.js';
import transformACSS   from './../../stylesheet/index.js';

const stylesheet = new CSSStyleSheet;
const cssCache   = createCache({ name: 'framework-css' });

// Inspect all caches and their stored requests
async function logAllCacheEntries () {
  // Retrieve names of all existing caches
  const cacheNames = await caches.keys();

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    // Retrieve all stored Request objects for the current cache
    const requests = await cache.keys();

    console.log(`[Cache Storage] Cache Name: ${cacheName}`);
    requests.forEach(request => console.log(`  - ${request.url}`));
  }
}

export async function initDefaultStylesheet (cssURL = './index.aufbau.css') {

  logAllCacheEntries ();
  
  const { cached, pulled } = await cssCache.getAndPull(cssURL, {
    onPull    : css => stylesheet.replace(css),
    transform : transformACSS,
    type      : 'text/css',
    
  });
  
  if (cached) stylesheet.replaceSync(cached); // stale
  console.log(cached ? '[SS] served from cache.' : '[SS] cache miss, waiting for source ...');
  
  if (!document.adoptedStyleSheets.includes(stylesheet))
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, stylesheet];

  if (!cached) await pulled; // cold start
  return stylesheet;
}

export default initDefaultStylesheet;
