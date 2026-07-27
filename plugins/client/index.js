// @aufbau/plugins/client

import transform from '@aufbau/stylesheet';

let observer = null;

/**
 * Fetches and transforms an external .aufbau.css or .ass stylesheet element.
 * @param {HTMLLinkElement} link
 */
export async function processStylesheetLink (node) {
  const href = node.getAttribute('href');
  if (!href || (!href.endsWith('.aufbau.css') && !href.endsWith('.ass'))) return;

  try {
    const response = await fetch(href); if (!response.ok) return;
    const ass      = await response.text();
    const css      = transform(ass);
    const element  = document.createElement('style');
    element.textContent = css;
    element.setAttribute('data-aufbau-src', href);
    node.replaceWith(element);
  } catch (err) {
    console.error(`[@aufbau/plugins/client] Failed to process link stylesheet: ${href}`, err);
  }
}

/**
 * Transforms an inline <style type="text/aufbau"> element.
 * @param {HTMLStyleElement} style
 */
export function processStylesheetElement (node) {
  if (node.type !== 'text/aufbau' || node.hasAttribute('data-aufbau-processed')) return;

  const ass = node.textContent;
  const css = transform(ass);

  node.textContent = css;
  node.type = 'text/css';
  node.setAttribute('data-aufbau-processed', 'true');
}

/**
 * Scans and transforms all existing stylesheets and inline styles in the DOM.
 */
export function processAllStylesheets () {
  if (typeof window === 'undefined' || !window.document) return;

  document.querySelectorAll   ('link[rel="stylesheet"]').forEach(processStylesheetLink);
  document.querySelectorAll('style[type="text/aufbau"]').forEach(processStylesheetElement);
}

/**
 * Observes DOM mutations specifically for Aufbau stylesheet elements and link tags.
 */
export function observeStylesheets () {
  if (typeof window === 'undefined' || !window.document || observer) return;

  processAllStylesheets();

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) { // Node.ELEMENT_NODE
          if (node.tagName === 'LINK') {
            processStylesheetLink(node);
          } else if (node.tagName === 'STYLE') {
            processStylesheetElement(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll   ('link[rel="stylesheet"]').forEach(processStylesheetLink);
            node.querySelectorAll('style[type="text/aufbau"]').forEach(processStylesheetElement);
          }
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}
