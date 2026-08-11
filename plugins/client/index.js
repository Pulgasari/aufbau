// @aufbau/plugins/client

import transformASS                             from '@aufbau/stylesheet';
import { compileStylesheet, publishStylesheet } from '@aufbau/cache';
import { createLogger  }  from '@aufbau/js';
import { pages, sheets }                        from '@aufbau/store';

// :::::: DATA

const EXTENSIONS = ['.aufbau.css', '.ass'];

// :::::: HELPERS

const isClient     = ()   => typeof window !== 'undefined' && window.document;
const isStylesheet = href => Boolean(href) && EXTENSIONS.some(extension => href.endsWith(extension));

// :::::: REFS

const log = createLogger('aufbau-client');
let observer = null;

// fetches and transforms an external .aufbau.css or .ass stylesheet element
export async function processStylesheetLink (node) {
  const href = node.getAttribute('href'); if (!isStylesheet(href)) return;

  try {
    const response = await fetch(href); if (!response.ok) return;
    const source   = await response.text();
    const css      = await compileStylesheet(source, transform);

    const style = document.createElement('style');
    style.textContent = css;
    style.setAttribute('data-aufbau-src', href);
    node.replaceWith(style);

    sheets.setSync(href, css);
  } catch (error) {
    log.error(`failed to process link stylesheet: ${href}`, error);
  }
}

// transforms an inline <style type="text/aufbau"> element
export function processStylesheetElement (node) {
  if (node.type !== 'text/aufbau' || node.hasAttribute('data-aufbau-processed')) return;

  // stays synchronous on purpose: the element is already in the document, so an
  // await here would hand the parser a frame of unstyled content for no gain.
  node.textContent = transformASS(node.textContent);
  node.type = 'text/css';
  node.setAttribute('data-aufbau-processed', 'true');
}

// scans and transforms all existing stylesheets and inline styles in the DOM.
export function processStylesheets (ctx) {
  if (!isClient()) return;
  ctx ??= document;
  ctx.querySelectorAll   ('link[rel="stylesheet"]').forEach(node => track(processStylesheetLink(node)));
  ctx.querySelectorAll('style[type="text/aufbau"]').forEach(processStylesheetElement);
}

// observes DOM mutations specifically for Aufbau stylesheet elements and link tags.
export function observeStylesheets () {
  if (!isClient() || observer) return;
  processStylesheets(); // synchronous, so `inflight` is populated before anyone can reach ready()

  observer = new MutationObserver ((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) { // Node.ELEMENT_NODE
             if (node.tagName === 'LINK')  processStylesheetLink    (node);
        else if (node.tagName === 'STYLE') processStylesheetElement (node);
        else if (node.querySelectorAll)    processStylesheets       (node);
        }
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}


/*
// File: aufbau/plugins/client/index.js
const CACHE_NAME = 'aufbau-css-v1';
// Stores compiled CSS in the shared Cache Storage under the original file URL.
// @param {string} url - Original request URL of the .aufbau.css file
// @param {string} compiledCss - CSS string compiled by aufbau/stylesheet
export async function cacheCompiledCss(url, compiledCss) {
  if (!('caches' in window)) return;

  const cache = await caches.open(CACHE_NAME);
  const response = new Response(compiledCss, {
    status: 200,
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'X-Aufbau-Compiled': 'true'
    }
  });

  await cache.put(url, response);
}
*/
