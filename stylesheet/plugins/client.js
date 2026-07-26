// @aufbau/stylesheet/plugins/client.js

import transform from './../index.js';

/**
 * Transforms a single <style type="text/aufbau"> element
 */
export function processStyleElement (styleEl) {
  if (styleEl.dataset.aufbauProcessed) return;

  const rawCode        = styleEl.textContent;
  const transformedCss = transform(rawCode);

  styleEl.textContent = transformedCss;
  styleEl.type        = 'text/css';
  styleEl.dataset.aufbauProcessed = 'true';
}

/**
 * Scans the document for all <style type="text/aufbau"> elements
 */
export function processAllStyles () {
  if (typeof document === 'undefined') return;
  const styles = document.querySelectorAll('style[type="text/aufbau"]');
  styles.forEach(processStyleElement);
}

/**
 * Starts the MutationObserver for dynamically injected style elements
 */
export function observeDom () {
  if (typeof window === 'undefined' || !window.document) return;

  processAllStyles();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) {
          if (node.tagName === 'STYLE' && node.type === 'text/aufbau') {
            processStyleElement(node);
          } else if (node.querySelectorAll) {
            const nested = node.querySelectorAll('style[type="text/aufbau"]');
            nested.forEach(processStyleElement);
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
