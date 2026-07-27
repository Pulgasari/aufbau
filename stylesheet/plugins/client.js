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

/**
 * Registers the Aufbau stylesheet Service Worker in the browser environment.
 */
export async function initAufbauClient () {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register(
      new URL('./worker.js', import.meta.url),
      { type: 'module', scope: '/' }
    );
    console.log('[@aufbau/stylesheet] Service worker registered:', registration.scope);
  } catch (error) {
    console.error('[@aufbau/stylesheet] Service worker registration failed:', error);
  }
}

/**
 * Client-side stylesheet processor using a Web Worker.
 */
/*
export function initAufbauClient() {
  if (typeof window === 'undefined') return;

  // Initialize Web Worker for background CSS processing
  const url    = new URL('./worker.js', import.meta.url);
  const worker = new Worker(url, { type: 'module' });

  const processStylesheet = async (link) => {
    if (!link.href || !link.href.includes('.aufbau.css')) return;

    try {
      const response = await fetch(link.href);
      const rawCss = await response.text();

      // Send CSS to background worker
      worker.postMessage({ id: link.href, code: rawCss });

      // Listen for transformed CSS response
      const handleMessage = (event) => {
        if (event.data.id === link.href) {
          const styleElement = document.createElement('style');
          styleElement.textContent = event.data.code;
          link.replaceWith(styleElement);
          worker.removeEventListener('message', handleMessage);
        }
      };

      worker.addEventListener('message', handleMessage);
    } catch (error) {
      console.error(`[aufbau] Failed to process stylesheet: ${link.href}`, error);
    }
  };

  // Process existing link tags
  document.querySelectorAll('link[rel="stylesheet"]').forEach(processStylesheet);
}
*/
