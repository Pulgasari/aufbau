// init.js

import * as client   from './client.js';
import * as elements from '@aufbau/elements';
import * as utils    from '@aufbau/js';
import configs       from './configs.js';

const { deepMerge, isPlainObject } = utils;
const BAD_KEYS  = new Set(['mode']);
const normalizeElements = value => value ?? null;

let isBooted = false;

// :::::: DEBUG

console.log('[runtime] configs:', configs);

// :::::: CONFIG

// pushes element config into the AufbauConfigStore as the lowest layer
function syncElementConfig () {
  const entries = {};
  for (const [key, value] of Object.entries(configs.elements)) {
    if (!BAD_KEYS.has(key)) entries[key] = value;
  }
  elements.setConfig(entries, { layer: 'defaults' });
}

function config (options = {}) {
  const { elements, splash, stylesheet, ...rest } = options;

  const normalized = normalizeElements(elements);
  if (normalized) deepMerge(configs.elements, normalized);
  if (splash)     deepMerge(configs.splash, splash);
  if (stylesheet) configs.stylesheet = stylesheet;

  deepMerge(configs.elements, rest);

  syncElementConfig(); // also runs on calls after boot, so config() stays live
  return configs;
}

// :::::: INIT



async function initElements ({ mode = 'auto' }) {
       if (mode === 'auto')      elements.autoloader();
  else if (mode === 'all') await elements.registerAll();
}

const initStylesheet = (bool) => bool && client.observeStylesheets();

// boots the aufbau runtime in the browser
async function init (options = {}) {
  config(options);

  if (typeof window !== 'undefined' && !isBooted) {
    initElements   (configs.elements);
    initStylesheet (configs.stylesheet);
    isBooted = true;
  }
  
  return aufbau;
}

// :::::: EXPORTS

export { config, init };
