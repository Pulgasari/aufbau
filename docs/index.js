// aufbau/docs/index.js

//import aufbau, { html } from '@aufbau/kits/preact-htm';
import { createDocsFW, html } from './docsfw.js';
//aufbau.init(); // initialize @aufbau7kit

// Service Worker registration for local assets
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .register(new URL('./sw.js', import.meta.url), { type: 'module' })
    .catch(err => console.error('[SW Error]:', err));
}

function VersionBanner() {
  return html`
    <div class="version-banner">
      <span>Version 2026.1 Active</span>
    </div>
  `;
}

createDocsFW({
  index  : 'readme.md',
  target : '#app',
  brand: {
    svg   : '$repo/logo.svg',
    title : 'aufbau'
  },
  
  vars: {
    repo  : '../',
  },
  
  sidebar: {
    docs       : 'readme.md',
    elements   : '$repo/elements/readme.md',
    kits       : '$repo/kits/readme.md',
    packages   : 'packages.md',
    resources  : 'resources.md',
  },

  // Content Injections (Component, File Path, or Raw HTML String)
  footerText : 'aufbau | 2026',
  before     : VersionBanner,
  after      : '<p class="content-feedback">Found an issue? Edit this page on GitHub.</p>'       
});
