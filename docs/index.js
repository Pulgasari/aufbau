// aufbau/docs/index.js

import aufbau, { html } from '@aufbau/kit';
import { createDocsFW } from './docsfw.js';
aufbau.init(); // initialize @aufbau7kit

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

function VersionBanner() {
  return html`
    <div class="version-banner">
      <span>🚀 Version 2026.1 Active</span>
    </div>
  `;
}

createDocsFW({
  title      : 'aufbau :: docs',
  index      : 'readme.md', // Start Markdown file
  target     : '#app',
  footerText : 'aufbau | 2026',

  // Flexible Object-Notation for sidebar
  sidebar: {
    kits       : 'docs/kits.md',
    packages   : 'docs/packages.md',
    resources  : 'docs/resources.md',
    components : 'webcomponents/readme.md',
  },

  // Content Injections (Component, File Path, or Raw HTML String)
  before : VersionBanner,
  after  : '<p class="content-feedback">Found an issue? Edit this page on GitHub.</p>'       
});
