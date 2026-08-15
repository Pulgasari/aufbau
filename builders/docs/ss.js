// @aufbau/builders/docs/ss.js

import { createCache } from '@bunker/cache';
import transformACSS   from '@aufbau/stylesheet';

const stylesheet = new CSSStyleSheet;
const cssCache   = createCache({ name: 'aufbau-framework-css' });

/*
  adopts the compiled framework stylesheet, from cache where there is one.

  a hit is applied synchronously and revalidated behind the page; the fresh version
  lands through onRevalidate. applying it mid-session is deliberate here — this is
  the docs shell, where a late reflow is cheaper than a stale layout.
*/
export async function initDefaultStylesheet (cssURL = './index.aufbau.css') {
  const response = await cssCache.staleWhileRevalidate(cssURL, {
    onRevalidate : async (fresh) => stylesheet.replace(await fresh.text()),
    transform    : transformACSS,
    type         : 'text/css',
  });

  // null only when there was no cache and the fetch failed. leave the sheet empty
  // rather than taking the page down over a stylesheet.
  if (response) stylesheet.replaceSync(await response.text());

  if (!document.adoptedStyleSheets.includes(stylesheet)) {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, stylesheet];
  }

  return stylesheet;
}

export default initDefaultStylesheet;
