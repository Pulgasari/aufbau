// @aufbau/kits/aufbau.js

// :::::: IMPORT ::::::::::::::::::::::::::::::::::::::::::::::::

// ::: AUFBAU-PACKAGES
import      aufbauCache         from '@aufbau/cache';
import * as aufbauElements      from '@aufbau/elements';
import * as aufbauFilters       from '@aufbau/filters';
import      aufbauImport        from '@aufbau/import';
import * as aufbauPluginsClient from '@aufbau/plugins/client';
import * as aufbauPluginsWorker from '@aufbau/plugins/worker';
import * as aufbauStore         from '@aufbau/store';
import * as aufbauStylesheet    from '@aufbau/stylesheet';
import * as aufbauUtils         from '@aufbau/js';

// ::: OTHERS
import * as bunker from '@bunker/kit';
import * as domina from '@domina/core';
import      str    from '@pulgasari/str';

// ::: LOCAL
const fileURL = new URL("./configs.json5", import.meta.url);
const configs = await aufbauImport(fileURL);
const { deepMerge, isPlainObject } = aufbauUtils;

// :::::: MISC ::::::::::::::::::::::::::::::::::::::::::::::::

const RESERVED_ELEMENT_KEYS = new Set(['mode']);
const normalizeElements = value => value ?? null;

// :::::: CONFIG ::::::::::::::::::::::::::::::::::::::::::::::::

// pushes element config into the AufbauConfigStore as the lowest layer
function syncElementConfig () {
  const entries = {};
  for (const [key, value] of Object.entries(configs.elements)) {
    if (!RESERVED_ELEMENT_KEYS.has(key)) entries[key] = value;
  }
  aufbauElements.setConfig(entries, { layer: 'defaults' });
}

export function config (options = {}) {
  const { elements, splash, stylesheet, ...rest } = options;

  const normalized = normalizeElements(elements);
  if (normalized)               deepMerge(configs.elements, normalized);
  if (splash)                   deepMerge(configs.splash, splash);
  if (stylesheet !== undefined) configs.stylesheet = stylesheet;

  // bare keys keep going to the element config, which is how this has always
  // been called: config({ mode: 'all' }), config({ 'toast-duration': 2000 })
  deepMerge(configs.elements, rest);

  syncElementConfig(); // also runs on calls after boot, so config() stays live
  return configs;
}

// :::::: RUNTIME ::::::::::::::::::::::::::::::::::::::::::::::::

let initialized = false;

// boots the aufbau runtime in the browser
export async function init (options = {}) {
  config(options);

  if (typeof window === 'undefined' || initialized) return aufbau;
  initialized = true;
  
  if (configs.stylesheet) aufbauPluginsClient.observeStylesheets();

       if (configs.elements.mode === 'auto')      aufbauElements.autoloader();
  else if (configs.elements.mode === 'all') await aufbauElements.registerAll();

  //if (configs.splash.fonts) aufbauUtils.gate('fonts', domina.fontsReady);

  return aufbau;
}

// ::: WORKERS STUFF

// combined master fetch handler for service workers
// checks all registered aufbau plugins in sequence
export async function interceptFetch (event) {
  // 1. stylesheet plugin
  const stylesheetResponse = await aufbauPluginsWorker.interceptFetchStylesheet(event);
  if (stylesheetResponse) return stylesheetResponse;

  // 2. fonts. cached as responses, so the browser's font pipeline is untouched
  //    and font-display / unicode-range keep working
  const fontResponse = await aufbauPluginsWorker.interceptFetchFont(event);
  if (fontResponse) return fontResponse;

  // 3. JS modules & CDN assets (Runtime Caching)
  const moduleResponse = await aufbauPluginsWorker.interceptFetchModule(event);
  if (moduleResponse) return moduleResponse;

  return null;
}

/*
// poo/playground/sw.js

import { interceptFetch } from '@aufbau/kit';

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      // Intercept Aufbau stylesheets and assets
      const aufbauResponse = await interceptFetch(event);
      if (aufbauResponse) return aufbauResponse;

      // Fallback to network fetch
      return fetch(event.request);
    })()
  );
});
*/

// maybe: register service worker. classic, NOT type: 'module' — a worker has no
// import map, so the aufbau worker shares code through importScripts() instead,
// and that exists only in a classic worker. see @aufbau/sw.js.
//if (sw) globalThis.navigator?.serviceWorker?.register(sw).catch(console.error);
// aufbau/docs/sw.js  als modul
//import { aufbauServiceWorker } from '../sw.js';
//aufbauServiceWorker({ precache: ['../js/index.js', '../kits/preact-htm.js'] });


// :::::: BUNDLE :::::::::::::::::::::::::::::::::::::::::::::::::

const aufbau = {
  // config + runtime
  config, configs,
  init, interceptFetch,
  
  //
  dom: domina, domina, str,

  // packages
  cache      : aufbauCache,
  elements   : aufbauElements,
  filters    : aufbauFilters,
  import     : aufbauImport,
  store      : aufbauStore,
  stylesheet : aufbauStylesheet,
  utils      : aufbauUtils,

  // storage engine. the aufbau presets above sit on this, but it is exposed raw
  // too, so an app can open its own database or cache without a second dependency.
  bunker,

  // adapters
  plugins : {
    client : aufbauPluginsClient,
    worker : aufbauPluginsWorker
  },
};

// :::::: EXPORT ::::::::::::::::::::::::::::::::::::::::::::::::

export { aufbau };
export default aufbau;

/* :::::: USAGE :::::::::::::::::::::::::::::::::::::::::::::::::

// no framework, elements only
import aufbau from '@aufbau/kits/aufbau';
await aufbau.init();

// with a framework
import aufbau, { html } from '@aufbau/kits/preact-htm';

*/
