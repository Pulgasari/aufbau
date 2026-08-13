// @aufbau/runtime/stylesheet.js

import { createCache } from './../../runtime/cache.js';
import transformACSS   from './../../stylesheet/index.js';

const stylesheet = new CSSStyleSheet;
const cssCache   = createCache({ name: 'framework-css' });

export async function initDefaultStylesheet (cssURL = './index.aufbau.css') {

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
