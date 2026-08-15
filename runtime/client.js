// @aufbau/runtime/client.js

import { createCache } from '@bunker/cache';
import transformACSS   from './../stylesheet/index.js'; //from '@aufbau/stylesheet';

// :::::: DATA

const cssCache   = createCache({ name: 'aufbau-stylesheets' });
const EXTENSIONS = ['.aufbau.css', '.ass'];
let   observer   = null;

// :::::: HELPERS

const isClient     = ()   => typeof window !== 'undefined' && window.document;
const isStylesheet = href => Boolean(href) && EXTENSIONS.some(extension => href.endsWith(extension));

// :::::: METHODS

/*
  <link href='... .aufbau.css' />

  the url is the identity, so a second page importing the same sheet is a hit. the
  compile runs inside the cache layer as its transform, which means it happens once
  per distinct source rather than once per navigation — and a 304 skips even that.
*/
export async function processStylesheetLink (node) {
  const href = node.getAttribute('href'); if (!isStylesheet(href)) return;

  try {
    const response = await cssCache.staleWhileRevalidate(href, {
      transform : transformACSS,
      type      : 'text/css; charset=utf-8',
    });
    if (!response) return;

    const element = document.createElement('style');
    element.textContent = await response.text();
    element.setAttribute('data-aufbau-src', href);
    node.replaceWith(element);
  }
  catch (e) { console.error(`failed to process link stylesheet: ${href}`, e); }
}

// <style type='text/aufbau'>
export function processStyleElement (node) {
  if (node.type !== 'text/aufbau' || node.hasAttribute('data-aufbau-processed')) return;

  node.textContent = transformACSS(node.textContent);
  node.type = 'text/css';
  node.setAttribute('data-aufbau-processed', 'true');
}

// scans and transforms all existing stylesheets and inline styles in the DOM.
export function processStylesheets (ctx = document) {
  ctx.querySelectorAll   ('link[rel="stylesheet"]').forEach(processStylesheetLink);
  ctx.querySelectorAll('style[type="text/aufbau"]').forEach(processStyleElement);
}

// observes DOM for Aufbau stylesheets
export function observeStylesheets (ctx = document.head) {
  if (!isClient() || observer) return;
  processStylesheets(); // synchronous, so `inflight` is populated before anyone can reach ready()

  observer = new MutationObserver (mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) { // Node.ELEMENT_NODE
             if (node.tagName === 'LINK')  processStylesheetLink (node);
        else if (node.tagName === 'STYLE') processStyleElement   (node);
        else if (node.querySelectorAll)    processStylesheets    (node);
        }
      }
    }
  });

  observer.observe (ctx, { childList: true, subtree: true });
}
