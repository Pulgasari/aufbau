// @aufbau/runtime/stylesheet.js

import { createCache, getContentHash } from './../runtime/cache.js';
import transformACSS from './../stylesheet/index.js';

export const frameworkStyleSheet = new CSSStyleSheet();

const cssCache = createCache({ name: 'framework-css' });


export async function initFrameworkStyle(cssUrl = './index.aufbau.css') {
  // 1. Read cached transformed CSS & hash from CacheStorage
  const cachedData = await cssCache.getMeta(cssUrl);

  // 2. STALE: Apply cached transformed CSS immediately if available
  if (cachedData?.content) {
    frameworkStyleSheet.replaceSync(cachedData.content);
  }

  // Ensure sheet is registered in adoptedStyleSheets
  if (!document.adoptedStyleSheets.includes(frameworkStyleSheet)) {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, frameworkStyleSheet];
  }

  // 3. REVALIDATE: Check server in background
  try {
    const response = await fetch(cssUrl, { cache: 'no-cache' });
    const rawCss   = await response.text();
    const hash     = getContentHash(rawCss);

    // Update if source content changed or cache missed
    if (!cachedData || cachedData.hash !== hash) {
      const transformedCss = await transformACSS(rawCss);

      // Hot replace stylesheet rules in memory instantly
      await frameworkStyleSheet.replace(transformedCss);

      // Update CacheStorage with new content and hash
      await cssCache.setMeta(cssUrl, transformedCss, hash);
    }
  } catch (error) {
    console.warn('[Aufbau] Failed to revalidate stylesheet:', error);
  }

  return frameworkStyleSheet;
}
