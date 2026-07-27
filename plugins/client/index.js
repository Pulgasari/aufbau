// @aufbau/plugins/client

import transform from '@aufbau/stylesheet';

let observer = null;

/**
 * Fetches and transforms an external .aufbau.css or .ass stylesheet element.
 * @param {HTMLLinkElement} link
 */
export async function processLinkStylesheet(link) {
  const href = link.getAttribute('href');
  if (!href || (!href.endsWith('.aufbau.css') && !href.endsWith('.ass'))) return;

  try {
    const response = await fetch(href);
    if (!response.ok) return;
    const rawCss = await response.text();
    const transformedCss = transform(rawCss);

    const styleEl = document.createElement('style');
    styleEl.textContent = transformedCss;
    styleEl.setAttribute('data-aufbau-src', href);
    link.replaceWith(styleEl);
  } catch (err) {
    console.error(`[@aufbau/plugins/client] Failed to process link stylesheet: ${href}`, err);
  }
}

/**
 * Transforms an inline <style type="text/aufbau"> element.
 * @param {HTMLStyleElement} style
 */
export function processStyleElement(style) {
  if (style.type !== 'text/aufbau' || style.hasAttribute('data-aufbau-processed')) return;

  const rawCss = style.textContent;
  const transformedCss = transform(rawCss);

  style.textContent = transformedCss;
  style.type = 'text/css';
  style.setAttribute('data-aufbau-processed', 'true');
}

/**
 * Scans and transforms all existing stylesheets and inline styles in the DOM.
 */
export function processAllStylesheets() {
  if (typeof window === 'undefined' || !window.document) return;

  document.querySelectorAll('link[rel="stylesheet"]').forEach(processLinkStylesheet);
  document.querySelectorAll('style[type="text/aufbau"]').forEach(processStyleElement);
}

/**
 * Observes DOM mutations specifically for Aufbau stylesheet elements and link tags.
 */
export function observeStylesheets() {
  if (typeof window === 'undefined' || !window.document || observer) return;

  processAllStylesheets();

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) { // Node.ELEMENT_NODE
          if (node.tagName === 'LINK') {
            processLinkStylesheet(node);
          } else if (node.tagName === 'STYLE') {
            processStyleElement(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll('link[rel="stylesheet"]').forEach(processLinkStylesheet);
            node.querySelectorAll('style[type="text/aufbau"]').forEach(processStyleElement);
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
