// aufbau/docs/index.js

import aufbau from '@aufbau/kit';
import { createDocsFW } from './docsfw.js';

// Initialize aufbau kit core
aufbau.init();

// Service Worker registration for local assets
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .register(new URL('./sw.js', import.meta.url), { type: 'module' })
    .catch(err => console.error('[SW Error]:', err));
}

// Mount DocsFW with project specific configuration
createDocsFW({
  title: 'aufbau / docs',
  target: '#app',
  footerText: 'aufbau | 2026',
  sidebar: [
    { title: 'Overview'   , path: 'readme.md' },
    { title: 'Kit'        , path: 'kit/readme.md' },
    { title: 'Stylesheet' , path: 'stylesheet/readme.md' },
    { title: 'Shaders'    , path: 'shaders/readme.md' },
  ]
});
