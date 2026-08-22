// init.js

import * as aufbauUtils         from '@aufbau/js';
import configs from './configs.js';

const { deepMerge, isPlainObject } = aufbauUtils;
console.log('[runtime] configs:', configs);

// :::::: CONFIG ::::::::::::::::::::::::::::::::::::::::::::::::

// pushes element config into the AufbauConfigStore as the lowest layer
function syncElementConfig () {
  const entries = {};
  for (const [key, value] of Object.entries(configs.elements)) {
    if (!RESERVED_ELEMENT_KEYS.has(key)) entries[key] = value;
  }
  aufbauElements.setConfig(entries, { layer: 'defaults' });
}

function config (options = {}) {
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
async function init (options = {}) {
  config(options);

  if (typeof window === 'undefined' || initialized) return aufbau;
  initialized = true;
  
  if (configs.stylesheet) aufbauClient.observeStylesheets();

       if (configs.elements.mode === 'auto')      aufbauElements.autoloader();
  else if (configs.elements.mode === 'all') await aufbauElements.registerAll();

  //if (configs.splash.fonts) aufbauUtils.gate('fonts', domina.fontsReady);

  return aufbau;
}

// :::::: EXPORTS

export { config, init };
