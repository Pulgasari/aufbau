// @aufbau/runtime/stylesheet.js

import { createCache } from './../../runtime/cache.js';
import transformACSS   from './../../stylesheet/index.js';

const defaultStylesheet = new CSSStyleSheet();
const cssCache = createCache({ name: 'framework-css' });

export async function initDefaultStylesheet (cssURL = './index.aufbau.css') {

  const { cached, pulled } = await cssCache.getAndPull(cssURL, {
    type      : 'text/css',
    transform : transformACSS,
    onPull    : (css) => defaultStylesheet.replace(css),
  });
  
  if (cached) defaultStylesheet.replaceSync(cached); // stale
  console.log(cached ? '[SS] served from cache.' : '[SS] cache miss, waiting for source ...');
  
  if (!document.adoptedStyleSheets.includes(defaultStylesheet))
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, defaultStylesheet];

  if (!cached) await pulled; // cold start
  return defaultStylesheet;
}

export default initDefaultStylesheet;
