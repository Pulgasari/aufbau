// @aufbau/builders/docs/ss.js

import { createCache } from '@bunker/cache';
import transformACSS   from '@aufbau/stylesheet';
import * as dom        from '@domina/core';

const stylesheet = new CSSStyleSheet;
const cssCache   = createCache({ name: 'aufbau-framework-css' });

const IMPORT_RULE = /@import\s+url\(\s*['"]?([^'")]+)['"]?\s*\)[^;]*;/g;

/*
  a constructed sheet drops @import outright — replace() and replaceSync() are
  specified to throw the rules away. the compiled .aufbau.css leads with a whole
  block of them (@aufbau-config import/themes, aufbau-webfont), so everything the
  shell builds on would silently never load.

  they are pulled out and hung into the head as <link>s instead, and left behind
  as a comment so the compiled text still reads like what came out of the
  transform. cascade order stays right: links are author sheets, the adopted one
  comes after them, so the shell keeps overriding the base css.
*/
function extractImports (css) {
  const urls = [];
  const code = css.replace(IMPORT_RULE, (rule, url) => {
    urls.push(url);
    return `/* ${rule} -> <link> */`;
  });
  return { code, urls };
}

/*
  adopts the compiled framework stylesheet, from cache where there is one.

  a hit is applied synchronously and revalidated behind the page; the fresh version
  lands through onRevalidate. applying it mid-session is deliberate here — this is
  the docs shell, where a late reflow is cheaper than a stale layout.
*/
export async function initDefaultStylesheet (cssURL = './index.aufbau.css') {
  // relative to the stylesheet, not to the page: a hand written @import inside a
  // .aufbau.css means the file next to it. the generated ones are absolute anyway
  const base = new URL(cssURL, document.baseURI).href;

  const adopt = (css, sync) => {
    const { code, urls } = extractImports(css);
    // setLink dedupes on rel + href, so the revalidation pass adds nothing twice
    for (const url of urls) dom.setLink({ href: new URL(url, base).href, rel: 'stylesheet' });
    return sync ? stylesheet.replaceSync(code) : stylesheet.replace(code);
  };

  const response = await cssCache.staleWhileRevalidate(cssURL, {
    onRevalidate : async (fresh) => adopt(await fresh.text(), false),
    transform    : transformACSS,
    type         : 'text/css',
  });

  // null only when there was no cache and the fetch failed. leave the sheet empty
  // rather than taking the page down over a stylesheet.
  if (response) adopt(await response.text(), true);

  if (!document.adoptedStyleSheets.includes(stylesheet)) {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, stylesheet];
  }

  return stylesheet;
}

export default initDefaultStylesheet;
