// @aufbau/plugins/client

import transform from '@aufbau/stylesheet';
import { compileStylesheet } from '@aufbau/cache';
import { createLogger } from '@aufbau/js';
import { pages, sheets } from '@aufbau/store';

const EXTENSIONS = ['.aufbau.css', '.ass'];

const log = createLogger('aufbau-client');

let observer = null;

/*
  what to do when a background revalidation finds that a stylesheet changed.

  'next-load'  write it, apply it on the next visit. the default, because a late
               swap reflows a page the reader is already looking at — usually worse
               than the short wait it saves.
  'immediate'  swap the rule text in place. the <style> element stays put, so the
               cascade position survives.
*/
let swapPolicy = 'next-load';

export function configure ({ swap } = {}) {
  if (swap === 'immediate' || swap === 'next-load') swapPolicy = swap;
  return { swap: swapPolicy };
}

const isStylesheet = (href) => Boolean(href) && EXTENSIONS.some(extension => href.endsWith(extension));

const bootStyleFor = (href) => document.querySelector(`style[data-aufbau-boot="${CSS.escape(href)}"]`);

/*
  the manifest boot.js reads on the next visit.

  taken from the dom in document order rather than from the order things finished
  loading, so the styles are re-injected in the order the cascade expects.
*/
function recordManifest () {
  const hrefs = [...document.querySelectorAll('style[data-aufbau-src]')]
    .map(style => style.getAttribute('data-aufbau-src'));

  if (hrefs.length) pages.setSync(location.pathname, hrefs);
}

/**
 * Fetches and transforms an external .aufbau.css or .ass stylesheet element.
 * @param {HTMLLinkElement} node
 */
export async function processStylesheetLink (node) {
  const href = node.getAttribute('href');
  if (!isStylesheet(href)) return;

  const booted = bootStyleFor(href);

  /*
    a boot style is already applied, so there is nothing to wait for. move it into
    the link's exact position instead of appending a second copy: replaceWith moves
    the existing element, which leaves the final dom identical to an uncached load.
  */
  if (booted) {
    node.replaceWith(booted);
    booted.setAttribute('data-aufbau-src', href);
    booted.removeAttribute('data-aufbau-boot');
    recordManifest();
    revalidate(href, booted);
    return;
  }

  try {
    const response = await fetch(href);
    if (!response.ok) return;

    const source = await response.text();
    const css    = await compileStylesheet(source, transform);

    const style = document.createElement('style');
    style.textContent = css;
    style.setAttribute('data-aufbau-src', href);
    node.replaceWith(style);

    sheets.setSync(href, css);
    recordManifest();
  } catch (error) {
    log.error(`failed to process link stylesheet: ${href}`, error);
  }
}

/*
  refetches a stylesheet that was served from the boot cache and reconciles it.

  runs after the page is interactive and stays entirely off the critical path — the
  page is already styled by the time this starts.
*/
async function revalidate (href, style) {
  try {
    const response = await fetch(href);
    if (!response.ok) return;

    const source = await response.text();
    const css    = await compileStylesheet(source, transform);

    if (css === style.textContent) return; // unchanged, nothing to write or swap

    sheets.setSync(href, css);
    if (swapPolicy === 'immediate') style.textContent = css;
  } catch (error) {
    // offline, or the file moved. the cached styles stay on the page, which is the
    // whole point of having served them.
    log.debug(`could not revalidate ${href}:`, error);
  }
}

/**
 * Transforms an inline <style type="text/aufbau"> element.
 * @param {HTMLStyleElement} node
 */
export function processStylesheetElement (node) {
  if (node.type !== 'text/aufbau' || node.hasAttribute('data-aufbau-processed')) return;

  // stays synchronous on purpose: the element is already in the document, so an
  // await here would hand the parser a frame of unstyled content for no gain.
  node.textContent = transform(node.textContent);
  node.type = 'text/css';
  node.setAttribute('data-aufbau-processed', 'true');
}

/**
 * Scans and transforms all existing stylesheets and inline styles in the DOM.
 */
export function processStylesheets (ctx) {
  if (typeof window === 'undefined' || !window.document) return;
  ctx ??= document;
  ctx.querySelectorAll   ('link[rel="stylesheet"]').forEach(processStylesheetLink);
  ctx.querySelectorAll('style[type="text/aufbau"]').forEach(processStylesheetElement);
}

/**
 * Observes DOM mutations specifically for Aufbau stylesheet elements and link tags.
 */
export function observeStylesheets () {
  if (typeof window === 'undefined' || !window.document || observer) return;

  processStylesheets();

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

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}
