// @aufbau/builders/docs/ss.js

import { compile }     from '@aufbau/ass';
import { createCache } from '@bunker/cache';
import adoptStylesheet from '@domina/methods/adoptStylesheet.js';

const KEY      = 'aufbau:docs:shell';
const cssCache = createCache({ name: 'aufbau-docs-css' });

/*
  adopts the docs shell, index.ass compiled to css, from cache where there is one.

  the compile is paid once: the cache stores the css, not the ass. a hit is applied
  straight away and revalidated behind the page, the fresh version lands through
  onRevalidate. applying it mid-session is deliberate here, a late reflow is cheaper
  than a stale layout. `replace` keeps both passes on the same sheet object, so its
  position in the cascade survives.

  imports: 'link' because the shell leads with a few @import, which a constructed
  sheet drops. base is the stylesheet, not the page: a relative @import means the
  file next to it.
*/
export async function initDefaultStylesheet (assURL = './index.ass') {
  const base  = new URL(assURL, document.baseURI).href;
  const adopt = (css) => adoptStylesheet(css, { base, imports: 'link', key: KEY, replace: true });

  const response = await cssCache.staleWhileRevalidate(assURL, {
    onRevalidate : async (fresh) => adopt(await fresh.text()),
    transform    : (source) => compile(source),
    type         : 'text/css',
  });

  // null only when there was no cache and the fetch failed. leave the page unstyled
  // rather than taking it down over a stylesheet.
  return response ? adopt(await response.text()) : null;
}

export default initDefaultStylesheet;
