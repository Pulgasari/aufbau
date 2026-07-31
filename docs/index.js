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

createDocsFW({
  title      : 'aufbau :: docs',
  target     : '#app',
  footerText : 'aufbau | 2026',
  sidebar: [
    { title: 'Overview'      , path: 'docs/readme.md' },
    { title: 'kits'          , path: 'docs/kits.md' },
    { title: 'packages'      , path: 'docs/packages.md' },
    { title: 'resources'     , path: 'docs/resources.md' },
    { title: 'webcomponents' , path: 'webcomponents/readme.md' },
  ]
});
