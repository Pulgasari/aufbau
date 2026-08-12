// @aufbau/runtime/stylesheet.js

import { createCache, getContentHash } from './../../runtime/cache.js';
import transformACSS from './../../stylesheet/index.js';

const defaultStylesheet = new CSSStyleSheet();
const cssCache = createCache({ name: 'framework-css' });

export async function initDefaultStylesheet (cssURL = './index.aufbau.css') {
  // 1. read cached transformed CSS & hash from CacheStorage
  const cachedData = await cssCache.getMeta(cssURL);

  // 2. STALE: apply cached transformed CSS immediately if available
  if (cachedData?.content) defaultStylesheet.replaceSync(cachedData.content);

  // ensure sheet is registered in adoptedStyleSheets
  if (!document.adoptedStyleSheets.includes(defaultStylesheet)) {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, defaultStylesheet];    
  }

  // 3. REVALIDATE: Check server in background
  try {
    const response = await fetch(cssURL, { cache: 'no-cache' });
    const rawCSS   = await response.text();
    const hash     = getContentHash(rawCSS);

    // update if source content changed or cache missed
    if (!cachedData || cachedData.hash !== hash) {
      const transformedCSS = await transformACSS(rawCSS);

      // hot replace stylesheet rules in memory instantly
      await defaultStylesheet.replace(transformedCSS);

      // update cache with new content and hash
      await cssCache.setMeta(cssURL, transformedCSS, hash);
    }
  } catch (error) {
    console.warn('[Aufbau] Failed to revalidate stylesheet:', error);
  }

  return defaultStylesheet;
}
