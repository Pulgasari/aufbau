// @aufbau/webcomponents

import AufbauButton from './AufbauButton.js';
import AufbauIcon   from './AufbauIcon.js';
import AufbauFlag   from './AufbauFlag.js';
// ... alle weiteren Komponenten

export function registerAllComponents () {
  const components = {
    'aufbau-button' : AufbauButton,
    'aufbau-icon'   : AufbauIcon,
    'aufbau-flag'   : AufbauFlag,
    // ...
  };

  Object.entries(components).forEach(([tag, CustomElement]) => {
    if (!customElements.get(tag)) {
      customElements.define(tag, CustomElement);
    }
  });
}

// Auto-register on direct script import
// import '@aufbau/webcomponents'
registerAllComponents();



// :::::: AUTOLOADER

const registered = new Set();

export function enableAutoComponents (basePath = 'https://cdn.jsdelivr.net/npm/@aufbau/components') {
  const scanAndLoad = () => {
    // Find all tags starting with aufbau-
    const elements = document.querySelectorAll('*');
    
    elements.forEach(el => {
      const tag = el.tagName.toLowerCase();
      
      if (tag.startsWith('aufbau-') && !registered.has(tag) && !customElements.get(tag)) {
        registered.add(tag);
        
        // Strip prefix: 'aufbau-flag' -> 'flag'
        const componentName = tag.replace('aufbau-', '');
        
        // Dynamic import on demand!
        import(`${basePath}/${componentName}.js`).catch(err => {
          console.warn(`[aufbau-autoloader] Could not auto-load component <${tag}>:`, err);
        });
      }
    });
  };

  // 1. Initial scan
  scanAndLoad();

  // 2. Observe DOM changes (e.g. dynamically injected HTML via @aufbau/import)
  const observer = new MutationObserver(scanAndLoad);
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });
}

