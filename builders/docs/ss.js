// @aufbau/builders/docs/ss.js

import { createCache } from '@bunker/cache';
import transformACSS   from '@aufbau/stylesheet';
import * as dom        from '@domina/core';

const KEY      = 'aufbau:docs:shell';
const cssCache = createCache({ name: 'aufbau-framework-css' });

/*
  adopts the compiled framework stylesheet, from cache where there is one.

  a hit is applied straight away and revalidated behind the page; the fresh version
  lands through onRevalidate. applying it mid-session is deliberate here — this is
  the docs shell, where a late reflow is cheaper than a stale layout. `replace` keeps
  both passes on the same sheet object, so its position in the cascade survives.

  imports: 'link' because the compiled css leads with a block of @import — the
  @aufbau-config imports, the themes and the webfonts — and a constructed sheet
  drops those on the floor. base is the stylesheet, not the page: a hand written
  @import inside a .aufbau.css means the file next to it.
*/
export async function initDefaultStylesheet (cssURL = './index.aufbau.css') {
  const base  = new URL(cssURL, document.baseURI).href;
  const adopt = (css) => dom.adoptStylesheet(css, { base, imports: 'link', key: KEY, replace: true });

  const response = await cssCache.staleWhileRevalidate(cssURL, {
    onRevalidate : async (fresh) => adopt(await fresh.text()),
    transform    : transformACSS,
    type         : 'text/css',
  });

  // null only when there was no cache and the fetch failed. leave the page unstyled
  // rather than taking it down over a stylesheet.
  return response ? adopt(await response.text()) : null;
}

export default initDefaultStylesheet;
