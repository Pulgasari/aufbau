// @aufbau/kits/aufbau.js

// :::::: IMPORT ::::::::::::::::::::::::::::::::::::::::::::::::

// ::: AUFBAU

import * as aufbauElements      from '@aufbau/elements';
import * as aufbauFilters       from '@aufbau/filters';
import      aufbauImport        from '@aufbau/import';
import * as aufbauPatterns      from '@aufbau/patterns';
import * as aufbauStore         from './store.js';
import * as aufbauStylesheet    from '@aufbau/stylesheet';
import * as aufbauUtils         from '@aufbau/js';

import * as aufbauClient from './client.js';
import * as aufbauWorker from './worker.js';

//const fileURL = new URL("./configs.json5", import.meta.url);
//const configs = await aufbauImport(fileURL);
import configs from './configs.js';

const { deepMerge, isPlainObject } = aufbauUtils;
console.log('[runtime] configs:', configs);

// ::: VENDORS

import * as bunker from '@bunker/kit';
import * as domina from '@domina/core';
import      str    from '@pulgasari/str';

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
  
  if (configs.stylesheet) aufbauClient.observeStylesheets();

       if (configs.elements.mode === 'auto')      aufbauElements.autoloader();
  else if (configs.elements.mode === 'all') await aufbauElements.registerAll();

  //if (configs.splash.fonts) aufbauUtils.gate('fonts', domina.fontsReady);

  return aufbau;
}



// :::::: BUNDLE :::::::::::::::::::::::::::::::::::::::::::::::::

const aufbau = {
  // config + runtime
  config, configs,
  init, //interceptFetch,
  
  //
  dom: domina, domina, str,

  // packages
  elements   : aufbauElements,
  filters    : aufbauFilters,
  import     : aufbauImport,
  patterns   : aufbauPatterns,
  store      : aufbauStore,
  stylesheet : aufbauStylesheet,
  utils      : aufbauUtils,

  // storage engine. the aufbau presets above sit on this, but it is exposed raw
  // too, so an app can open its own database or cache without a second dependency.
  // aufbau.cache used to be a second cache layer of its own; it is bunker.cache now.
  bunker,

  // adapters
  plugins : {
    client : aufbauClient,
    worker : aufbauWorker
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
