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

function VersionBanner() {
  return html`
    <div class="version-banner">
      <span>🚀 Version 2026.1 Active</span>
    </div>
  `;
}

createDocsFW({
  index  : 'readme.md',
  target : '#app',
  title  : 'aufbau :: docs',
  sidebar: {
    components : 'webcomponents/readme.md',
    kits       : 'docs/kits.md',
    packages   : 'docs/packages.md',
    resources  : 'docs/resources.md',
  },

  // Content Injections (Component, File Path, or Raw HTML String)
  footerText : 'aufbau | 2026',
  before     : VersionBanner,
  after      : '<p class="content-feedback">Found an issue? Edit this page on GitHub.</p>'       
});
