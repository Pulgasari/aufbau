// @aufbau/stylesheet/plugins/client.js

import transform from './../index.js';

// Transformiert ein einzelnes Style-Element
function processStyleElement(styleEl) {
  if (styleEl.dataset.aufbauProcessed) return;

  const rawCode = styleEl.textContent;
  const transformedCss = transform(rawCode);

  // Ersetze den Inhalt und markiere den Tag
  styleEl.textContent = transformedCss;
  styleEl.type = 'text/css';
  styleEl.dataset.aufbauProcessed = 'true';
}

// Scant das Dokument nach allen <style type="text/aufbau"> Blöcken
export function processAllStyles() {
  const styles = document.querySelectorAll('style[type="text/aufbau"]');
  styles.forEach(processStyleElement);
}

// Startet den MutationObserver für dynamisch injizierten Code
export function observeDom() {
  if (typeof window === 'undefined' || !window.document) return;

  // Initialer Scan
  processAllStyles();

  // Observer für dynamische Änderungen
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
    childList : true,
    subtree   : true
  });
}
